export const SERVICE_CATEGORIES = [
  { id: 'software-development', name: 'Software Development' },
  { id: 'graphic-design', name: 'Graphic Design' },
  { id: 'artwork-painting', name: 'Artwork | Painting' },
  { id: 'architecture', name: 'Architecture' },
] as const;

export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]['id'];
