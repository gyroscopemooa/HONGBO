function wonAmount(value?: string | null): number | null {
  const text = value?.trim();
  if (text === "무료") return 0;
  if (!text || !/^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)\s*원?$/.test(text)) return null;
  const amount = Number(text.replace(/[,\s원]/g, ""));
  return Number.isSafeInteger(amount) ? amount : null;
}

export function productDiscount(regularPrice?: string | null, salePrice?: string | null): number | null {
  const regular = wonAmount(regularPrice);
  const sale = wonAmount(salePrice);
  if (regular === null || sale === null || regular <= sale) return null;
  return Math.round((regular - sale) / regular * 100);
}
