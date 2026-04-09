// 用户类型
export interface User {
  id: string;
  name: string;
  color: string;
}

// 旅游标记类型
export interface TourismMark {
  id: string;
  userId: string;
  type: 'domestic' | 'international';
  regionId: string;
  regionName: string;
  createdAt: number;
}

// 城市访问类型
export interface CityVisit {
  id: string;
  markId: string;
  cityName: string;
  visitDate: number;
  description: string;
  imageUrl: string;
}

// 地图标记类型
export interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  userColor: string;
  cityVisits: CityVisit[];
}