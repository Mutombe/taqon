/**
 * Zimbabwe areas with approximate driving distance from Harare (km).
 * Used for transport cost calculation in Solar Advisor.
 * Grouped by province for easy browsing.
 */

export const ZIMBABWE_AREAS = [
  // Harare & Surrounds
  { name: 'Harare CBD', distance: 0, province: 'Harare' },
  { name: 'Avondale', distance: 5, province: 'Harare' },
  { name: 'Borrowdale', distance: 12, province: 'Harare' },
  { name: 'Mount Pleasant', distance: 8, province: 'Harare' },
  { name: 'Highlands', distance: 6, province: 'Harare' },
  { name: 'Greendale', distance: 10, province: 'Harare' },
  { name: 'Eastlea', distance: 5, province: 'Harare' },
  { name: 'Mabelreign', distance: 10, province: 'Harare' },
  { name: 'Marlborough', distance: 15, province: 'Harare' },
  { name: 'Glen Lorne', distance: 18, province: 'Harare' },
  { name: 'Chisipite', distance: 15, province: 'Harare' },
  { name: 'Greystone Park', distance: 14, province: 'Harare' },
  { name: 'Mandara', distance: 12, province: 'Harare' },
  { name: 'Waterfalls', distance: 10, province: 'Harare' },
  { name: 'Glen View', distance: 15, province: 'Harare' },
  { name: 'Budiriro', distance: 18, province: 'Harare' },
  { name: 'Mbare', distance: 5, province: 'Harare' },
  { name: 'Hatfield', distance: 8, province: 'Harare' },
  { name: 'Belvedere', distance: 6, province: 'Harare' },
  { name: 'Bluff Hill', distance: 12, province: 'Harare' },
  { name: 'Emerald Hill', distance: 7, province: 'Harare' },
  { name: 'Gunhill', distance: 10, province: 'Harare' },
  { name: 'Hillside (Harare)', distance: 8, province: 'Harare' },
  { name: 'Tynwald', distance: 14, province: 'Harare' },
  { name: 'Westgate', distance: 12, province: 'Harare' },
  { name: 'Ashdown Park', distance: 13, province: 'Harare' },
  { name: 'Arcturus', distance: 30, province: 'Harare' },
  { name: 'Ruwa', distance: 25, province: 'Harare' },
  { name: 'Epworth', distance: 18, province: 'Harare' },
  { name: 'Chitungwiza', distance: 25, province: 'Harare' },
  { name: 'Norton', distance: 40, province: 'Harare' },

  // Mashonaland West
  { name: 'Chinhoyi', distance: 115, province: 'Mashonaland West' },
  { name: 'Karoi', distance: 200, province: 'Mashonaland West' },
  { name: 'Kariba', distance: 365, province: 'Mashonaland West' },
  { name: 'Kadoma', distance: 140, province: 'Mashonaland West' },
  { name: 'Chegutu', distance: 100, province: 'Mashonaland West' },

  // Mashonaland East
  { name: 'Marondera', distance: 72, province: 'Mashonaland East' },
  { name: 'Mutoko', distance: 143, province: 'Mashonaland East' },
  { name: 'Murewa', distance: 85, province: 'Mashonaland East' },

  // Mashonaland Central
  { name: 'Bindura', distance: 88, province: 'Mashonaland Central' },
  { name: 'Shamva', distance: 95, province: 'Mashonaland Central' },
  { name: 'Mazowe', distance: 40, province: 'Mashonaland Central' },
  { name: 'Mvurwi', distance: 120, province: 'Mashonaland Central' },
  { name: 'Centenary', distance: 170, province: 'Mashonaland Central' },

  // Manicaland
  { name: 'Mutare', distance: 263, province: 'Manicaland' },
  { name: 'Rusape', distance: 170, province: 'Manicaland' },
  { name: 'Nyanga', distance: 268, province: 'Manicaland' },
  { name: 'Chimanimani', distance: 325, province: 'Manicaland' },
  { name: 'Chipinge', distance: 395, province: 'Manicaland' },

  // Midlands
  { name: 'Gweru', distance: 275, province: 'Midlands' },
  { name: 'Kwekwe', distance: 215, province: 'Midlands' },
  { name: 'Zvishavane', distance: 350, province: 'Midlands' },
  { name: 'Shurugwi', distance: 310, province: 'Midlands' },
  { name: 'Redcliff', distance: 225, province: 'Midlands' },
  { name: 'Gokwe', distance: 295, province: 'Midlands' },

  // Masvingo
  { name: 'Masvingo', distance: 292, province: 'Masvingo' },
  { name: 'Chiredzi', distance: 395, province: 'Masvingo' },
  { name: 'Triangle', distance: 410, province: 'Masvingo' },

  // Matabeleland North
  { name: 'Bulawayo', distance: 440, province: 'Matabeleland North' },
  { name: 'Victoria Falls', distance: 878, province: 'Matabeleland North' },
  { name: 'Hwange', distance: 700, province: 'Matabeleland North' },
  { name: 'Lupane', distance: 530, province: 'Matabeleland North' },

  // Matabeleland South
  { name: 'Beitbridge', distance: 580, province: 'Matabeleland South' },
  { name: 'Gwanda', distance: 510, province: 'Matabeleland South' },
  { name: 'Plumtree', distance: 500, province: 'Matabeleland South' },
  { name: 'Filabusi', distance: 470, province: 'Matabeleland South' },
];

export function getDistanceByArea(areaName) {
  const area = ZIMBABWE_AREAS.find(a => a.name === areaName);
  return area ? area.distance : 10;
}
