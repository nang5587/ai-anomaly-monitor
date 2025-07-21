export function groupLogsByProductAndLot(logs: any[]) {
  const grouped: Record<string, Record<string, any[]>> = {};

  logs.forEach((log) => {
    const product = log.product_name || '미지정';
    const lot = log.epc_lot || '미지정';

    if (!grouped[product]) grouped[product] = {};
    if (!grouped[product][lot]) grouped[product][lot] = [];

    grouped[product][lot].push(log);
  });

  return grouped;
}
