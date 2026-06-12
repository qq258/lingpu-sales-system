import prisma from './prisma';

function padNumber(num: number, length: number): string {
  return String(num).padStart(length, '0');
}

export async function generateOrderNo(prefix: string, storeCode: string): Promise<string> {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    padNumber(now.getMonth() + 1, 2) +
    padNumber(now.getDate(), 2);
  const baseNo = `${prefix}${storeCode}${dateStr}`;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  let lastRecord: { entry_no?: string; check_no?: string; transfer_no?: string; order_no?: string } | null = null;

  if (prefix === 'PO') {
    lastRecord = await prisma.pch_purchase_entry.findFirst({
      where: { entry_no: { startsWith: baseNo } },
      orderBy: { entry_no: 'desc' },
      select: { entry_no: true },
    });
  } else if (prefix === 'CK') {
    lastRecord = await prisma.wh_inventory_check.findFirst({
      where: { check_no: { startsWith: baseNo } },
      orderBy: { check_no: 'desc' },
      select: { check_no: true },
    });
  } else if (prefix === 'TF') {
    lastRecord = await prisma.wh_transfer.findFirst({
      where: { transfer_no: { startsWith: baseNo } },
      orderBy: { transfer_no: 'desc' },
      select: { transfer_no: true },
    });
  } else if (prefix === 'SA') {
    lastRecord = await prisma.sale_order.findFirst({
      where: { order_no: { startsWith: baseNo } },
      orderBy: { order_no: 'desc' },
      select: { order_no: true },
    });
  }

  let seq = 1;
  if (lastRecord) {
    const lastNo = (lastRecord as any).entry_no || (lastRecord as any).check_no || (lastRecord as any).transfer_no || (lastRecord as any).order_no || '';
    const lastSeq = parseInt(lastNo.slice(-4), 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${baseNo}${padNumber(seq, 4)}`;
}
