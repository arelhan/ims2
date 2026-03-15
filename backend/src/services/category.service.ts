import { prisma } from '../lib/prisma'

export async function getAllCategories() {
  return prisma.category.findMany({
    include: {
      _count: { select: { devices: true, customFields: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createCategory(data: { name: string; description?: string }) {
  return prisma.category.create({ data })
}

export async function updateCategory(id: string, data: { name?: string; description?: string }) {
  return prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  const count = await prisma.device.count({ where: { categoryId: id } })
  if (count > 0) {
    throw { status: 400, message: `Cannot delete: ${count} device(s) are using this category` }
  }
  return prisma.category.delete({ where: { id } })
}

export async function getFields(categoryId: string) {
  return prisma.customField.findMany({
    where: { categoryId },
    orderBy: { order: 'asc' },
  })
}

export async function createField(
  categoryId: string,
  data: {
    label: string
    fieldKey: string
    fieldType?: string
    isRequired?: boolean
    placeholder?: string
    order?: number
  }
) {
  return prisma.customField.create({ data: { ...data, categoryId } })
}

export async function updateField(
  categoryId: string,
  fieldId: string,
  data: {
    label?: string
    fieldType?: string
    isRequired?: boolean
    placeholder?: string
    order?: number
  }
) {
  return prisma.customField.update({
    where: { id: fieldId, categoryId },
    data,
  })
}

export async function deleteField(categoryId: string, fieldId: string) {
  return prisma.customField.delete({ where: { id: fieldId, categoryId } })
}

export async function reorderFields(categoryId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.customField.update({
        where: { id, categoryId },
        data: { order: index },
      })
    )
  )
  return prisma.customField.findMany({ where: { categoryId }, orderBy: { order: 'asc' } })
}
