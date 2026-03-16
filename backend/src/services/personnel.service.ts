import { prisma } from '../lib/prisma'

type PersonnelPayload = {
  name: string
  email: string
  departmentId?: string
  department?: string
  phone?: string
}

type PersonnelUpdatePayload = {
  name?: string
  email?: string
  departmentId?: string
  department?: string
  phone?: string
}

type ParsedPersonnelCsvRow = {
  name: string
  email: string
  department: string
  phone?: string
}

function normalizeDepartmentName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

async function resolveDepartmentId(input: { departmentId?: string; department?: string }): Promise<string> {
  if (input.departmentId) {
    const exists = await prisma.department.findUnique({ where: { id: input.departmentId } })
    if (!exists) throw { status: 400, message: 'Invalid department selected' }
    return input.departmentId
  }

  const departmentName = input.department ? normalizeDepartmentName(input.department) : ''
  if (!departmentName) throw { status: 400, message: 'Department is required' }

  const existing = await prisma.department.findUnique({ where: { name: departmentName } })
  if (existing) return existing.id

  const created = await prisma.department.create({ data: { name: departmentName } })
  return created.id
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function parsePersonnelCsv(csvContent: string): ParsedPersonnelCsvRow[] {
  const lines = csvContent
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw { status: 400, message: 'CSV must contain header and at least one row' }
  }

  const header = parseCsvLine(lines[0]).map(value => value.toLowerCase())
  const expected = ['name', 'email', 'department', 'phone']
  const isValidHeader = expected.every((key, index) => header[index] === key)
  if (!isValidHeader) {
    throw { status: 400, message: 'Invalid template. Header must be: name,email,department,phone' }
  }

  return lines.slice(1).map((line, index) => {
    const [name, email, department, phone] = parseCsvLine(line)
    if (!name || !email || !department) {
      throw { status: 400, message: `Row ${index + 2}: name, email and department are required` }
    }

    return {
      name,
      email,
      department,
      phone: phone || undefined,
    }
  })
}

export async function getAllPersonnel(search?: string) {
  return prisma.personnel.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { department: { name: { contains: search } } },
          ],
        }
      : undefined,
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { assignments: true } },
      assignments: {
        where: { isActive: true },
        include: {
          device: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getPersonnelById(id: string) {
  const p = await prisma.personnel.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      assignments: {
        include: {
          device: {
            include: {
              category: true,
              brand: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  })
  if (!p) throw { status: 404, message: 'Personnel not found' }
  return p
}

export async function createPersonnel(data: PersonnelPayload) {
  const departmentId = await resolveDepartmentId(data)
  return prisma.personnel.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      departmentId,
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  })
}

export async function updatePersonnel(id: string, data: PersonnelUpdatePayload) {
  const updateData: {
    name?: string
    email?: string
    phone?: string
    departmentId?: string
  } = {
    name: data.name,
    email: data.email,
    phone: data.phone,
  }

  if (data.departmentId || data.department) {
    updateData.departmentId = await resolveDepartmentId(data)
  }

  return prisma.personnel.update({
    where: { id },
    data: updateData,
    include: {
      department: { select: { id: true, name: true } },
    },
  })
}

export async function deletePersonnel(id: string) {
  const active = await prisma.assignment.count({ where: { personnelId: id, isActive: true } })
  if (active > 0) {
    throw { status: 400, message: `Cannot delete: person has ${active} active device assignment(s). Return the devices first.` }
  }
  // Cascade in schema handles historical assignments
  return prisma.personnel.delete({ where: { id } })
}

export function getPersonnelImportTemplateCsv(): string {
  return [
    'name,email,department,phone',
    'Ayse Yilmaz,ayse.yilmaz@firma.com,IT,05551234567',
    'Mehmet Demir,mehmet.demir@firma.com,Finance,',
  ].join('\n')
}

export async function importPersonnelFromCsv(fileBuffer: Buffer) {
  const rows = parsePersonnelCsv(fileBuffer.toString('utf-8'))
  const errors: string[] = []
  const created: string[] = []
  const seenEmails = new Set<string>()

  for (const row of rows) {
    const email = row.email.trim().toLowerCase()
    if (seenEmails.has(email)) {
      errors.push(`${row.email}: duplicate email in file`)
      continue
    }
    seenEmails.add(email)

    const exists = await prisma.personnel.findUnique({ where: { email } })
    if (exists) {
      errors.push(`${row.email}: email already exists`)
      continue
    }

    const departmentName = normalizeDepartmentName(row.department)
    const department = await prisma.department.upsert({
      where: { name: departmentName },
      update: {},
      create: { name: departmentName },
      select: { id: true },
    })

    await prisma.personnel.create({
      data: {
        name: row.name.trim(),
        email,
        phone: row.phone?.trim() || undefined,
        departmentId: department.id,
      },
    })

    created.push(email)
  }

  return {
    totalRows: rows.length,
    createdCount: created.length,
    skippedCount: errors.length,
    errors,
  }
}
