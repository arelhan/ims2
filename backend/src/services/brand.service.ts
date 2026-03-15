import { prisma } from '../lib/prisma'

export async function getAllBrands() {
  return prisma.brand.findMany({
    include: { _count: { select: { devices: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createBrand(data: { name: string }) {
  return prisma.brand.create({ data })
}

export async function updateBrand(id: string, data: { name: string }) {
  return prisma.brand.update({ where: { id }, data })
}

export async function deleteBrand(id: string) {
  return prisma.brand.delete({ where: { id } })
}
