import prisma from './prisma';

export interface SkuInfo {
  brand_name: string
  model_name: string
  sku_code: string
  color: string
  storage: string
  cost_price: number
  sale_price: number
}

function formatStorage(ram: string | null, rom: string | null): string {
  const parts: string[] = [];
  if (ram) parts.push(ram);
  if (rom) parts.push(rom);
  return parts.join('/');
}

export async function getSkuInfo(skuId: number): Promise<SkuInfo | null> {
  const sku = await prisma.pdt_sku.findUnique({
    where: { id: skuId },
    include: {
      model: {
        include: { brand: { select: { name: true } } },
      },
    },
  });
  if (!sku) return null;
  return {
    brand_name: sku.model?.brand?.name || '',
    model_name: sku.model?.name || '',
    sku_code: sku.sku_code || '',
    color: sku.color || '',
    storage: formatStorage(sku.ram, sku.rom),
    cost_price: sku.cost_price || 0,
    sale_price: sku.sale_price || 0,
  };
}
