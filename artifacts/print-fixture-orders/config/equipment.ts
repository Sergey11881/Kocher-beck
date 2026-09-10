export type EquipmentType = 'printing' | 'magnetic' | 'kms' | 'gapmaster' | 'flat_base';

export interface EquipmentInfo {
  type: EquipmentType;
  title: string;
  description: string;
  image: number;
  isPlaceholder: boolean;
}

export const equipmentCatalog: EquipmentInfo[] = [
  {
    type: 'printing',
    title: 'Формный / печатный цилиндр',
    description: 'Для печатных форм и цилиндров с заданным раппортом.',
    image: require('@/assets/images/company-logo-icon.png'),
    isPlaceholder: true,
  },
  {
    type: 'magnetic',
    title: 'Магнитный цилиндр',
    description: 'Магнитный цилиндр для ротационной высечки этикеток.',
    image: require('@/assets/images/company-logo-icon.png'),
    isPlaceholder: true,
  },
  {
    type: 'kms',
    title: 'KMS',
    description: 'Система для специальных вырубных и рабочих узлов.',
    image: require('@/assets/images/company-logo-icon.png'),
    isPlaceholder: true,
  },
  {
    type: 'gapmaster',
    title: 'GapMaster',
    description: 'Решение для точной настройки вырубной секции.',
    image: require('@/assets/images/company-logo-icon.png'),
    isPlaceholder: true,
  },
  {
    type: 'flat_base',
    title: 'Плоская магнитная база',
    description: 'Плоская база для магнитного инструмента и оснастки.',
    image: require('@/assets/images/company-logo-icon.png'),
    isPlaceholder: true,
  },
];

export function getEquipmentInfo(type?: string) {
  return equipmentCatalog.find((item) => item.type === type);
}

export function getEquipmentImage(type?: string) {
  return getEquipmentInfo(type)?.image ?? equipmentCatalog[0].image;
}
