/**
 * BuildMetrics — Steel Section Database
 * Properties from SCI Blue Book (BS EN 1993)
 * Units: dimensions in mm, area in cm², I in cm⁴, Z in cm³, r in cm, J in cm⁴, Cw in dm⁶
 *
 * UB/UC: r = root radius (mm), Cw = warping constant (dm⁶, approximate)
 * CHS: d = outer diameter (mm), t = wall thickness (mm)
 * RHS: H = overall height (mm), B = overall width (mm), t = wall thickness (mm)
 * SHS: H = overall height/width (mm), t = wall thickness (mm)
 *
 * Sxx, Syy = plastic section modulus (cm³)
 */
window.SteelSections = {

    // -------------------------------------------------------------------------
    // UB — Universal Beams (BS EN 10365)
    // -------------------------------------------------------------------------
    UB: [
        {
            designation: "127x76x13",
            mass: 13.0, h: 127.0, b: 76.0, tw: 4.0, tf: 7.6, r: 7.6,
            A: 16.5, Ixx: 473, Iyy: 55.7,
            Zxx: 74.6, Zyy: 14.7,
            Sxx: 84.2, Syy: 22.6,
            rxx: 5.35, ryy: 1.84,
            J: 2.85, Cw: 0.00568
        },
        {
            designation: "152x89x16",
            mass: 16.0, h: 152.4, b: 88.7, tw: 4.5, tf: 7.7, r: 7.6,
            A: 20.3, Ixx: 834, Iyy: 89.8,
            Zxx: 109, Zyy: 20.2,
            Sxx: 123, Syy: 31.2,
            rxx: 6.42, ryy: 2.10,
            J: 3.56, Cw: 0.0143
        },
        {
            designation: "178x102x19",
            mass: 19.0, h: 177.8, b: 101.2, tw: 4.8, tf: 7.9, r: 7.6,
            A: 24.3, Ixx: 1360, Iyy: 137,
            Zxx: 153, Zyy: 27.1,
            Sxx: 171, Syy: 41.6,
            rxx: 7.48, ryy: 2.37,
            J: 4.41, Cw: 0.0309
        },
        {
            designation: "203x102x23",
            mass: 23.1, h: 203.2, b: 101.8, tw: 5.4, tf: 9.3, r: 7.6,
            A: 29.4, Ixx: 2100, Iyy: 164,
            Zxx: 207, Zyy: 32.2,
            Sxx: 234, Syy: 49.7,
            rxx: 8.46, ryy: 2.36,
            J: 7.02, Cw: 0.0572
        },
        {
            designation: "203x133x25",
            mass: 25.1, h: 203.2, b: 133.2, tw: 5.7, tf: 7.8, r: 7.6,
            A: 32.0, Ixx: 2340, Iyy: 308,
            Zxx: 231, Zyy: 46.2,
            Sxx: 258, Syy: 70.9,
            rxx: 8.55, ryy: 3.10,
            J: 5.96, Cw: 0.116
        },
        {
            designation: "203x133x30",
            mass: 30.0, h: 206.8, b: 133.9, tw: 6.4, tf: 9.6, r: 7.6,
            A: 38.0, Ixx: 2900, Iyy: 385,
            Zxx: 280, Zyy: 57.5,
            Sxx: 314, Syy: 88.2,
            rxx: 8.71, ryy: 3.18,
            J: 10.3, Cw: 0.147
        },
        {
            designation: "254x102x22",
            mass: 22.0, h: 254.0, b: 101.6, tw: 5.7, tf: 6.8, r: 7.6,
            A: 28.0, Ixx: 2840, Iyy: 119,
            Zxx: 224, Zyy: 23.5,
            Sxx: 256, Syy: 36.6,
            rxx: 10.1, ryy: 2.06,
            J: 5.11, Cw: 0.101
        },
        {
            designation: "254x102x25",
            mass: 25.2, h: 257.2, b: 101.9, tw: 6.0, tf: 8.4, r: 7.6,
            A: 32.0, Ixx: 3410, Iyy: 149,
            Zxx: 265, Zyy: 29.2,
            Sxx: 306, Syy: 45.4,
            rxx: 10.3, ryy: 2.15,
            J: 8.55, Cw: 0.127
        },
        {
            designation: "254x102x28",
            mass: 28.3, h: 260.4, b: 102.2, tw: 6.3, tf: 10.0, r: 7.6,
            A: 36.1, Ixx: 4000, Iyy: 178,
            Zxx: 307, Zyy: 34.9,
            Sxx: 353, Syy: 54.2,
            rxx: 10.5, ryy: 2.22,
            J: 13.3, Cw: 0.155
        },
        {
            designation: "254x146x31",
            mass: 31.1, h: 251.4, b: 146.1, tw: 6.0, tf: 8.6, r: 7.6,
            A: 39.7, Ixx: 4410, Iyy: 448,
            Zxx: 351, Zyy: 61.3,
            Sxx: 393, Syy: 94.1,
            rxx: 10.5, ryy: 3.36,
            J: 10.6, Cw: 0.319
        },
        {
            designation: "254x146x37",
            mass: 37.0, h: 256.0, b: 146.4, tw: 6.3, tf: 10.9, r: 7.6,
            A: 47.2, Ixx: 5540, Iyy: 571,
            Zxx: 433, Zyy: 78.0,
            Sxx: 483, Syy: 119,
            rxx: 10.8, ryy: 3.48,
            J: 20.2, Cw: 0.411
        },
        {
            designation: "254x146x43",
            mass: 43.0, h: 259.6, b: 147.3, tw: 7.2, tf: 12.7, r: 7.6,
            A: 54.8, Ixx: 6540, Iyy: 677,
            Zxx: 504, Zyy: 92.1,
            Sxx: 566, Syy: 141,
            rxx: 10.9, ryy: 3.52,
            J: 32.8, Cw: 0.499
        },
        {
            designation: "305x102x25",
            mass: 24.8, h: 304.8, b: 101.6, tw: 5.8, tf: 6.8, r: 7.6,
            A: 31.6, Ixx: 4450, Iyy: 116,
            Zxx: 292, Zyy: 22.9,
            Sxx: 336, Syy: 35.7,
            rxx: 11.9, ryy: 1.92,
            J: 6.35, Cw: 0.178
        },
        {
            designation: "305x102x28",
            mass: 28.2, h: 308.7, b: 101.8, tw: 6.0, tf: 8.8, r: 7.6,
            A: 35.9, Ixx: 5360, Iyy: 149,
            Zxx: 347, Zyy: 29.2,
            Sxx: 402, Syy: 45.5,
            rxx: 12.2, ryy: 2.04,
            J: 13.6, Cw: 0.227
        },
        {
            designation: "305x102x33",
            mass: 32.8, h: 312.7, b: 102.4, tw: 6.6, tf: 10.8, r: 7.6,
            A: 41.8, Ixx: 6500, Iyy: 194,
            Zxx: 416, Zyy: 37.9,
            Sxx: 481, Syy: 58.9,
            rxx: 12.5, ryy: 2.15,
            J: 25.5, Cw: 0.294
        },
        {
            designation: "305x165x40",
            mass: 40.3, h: 303.4, b: 165.0, tw: 6.0, tf: 10.2, r: 8.9,
            A: 51.5, Ixx: 8500, Iyy: 764,
            Zxx: 560, Zyy: 92.6,
            Sxx: 623, Syy: 141,
            rxx: 12.9, ryy: 3.86,
            J: 20.7, Cw: 0.859
        },
        {
            designation: "305x165x46",
            mass: 46.1, h: 306.6, b: 165.7, tw: 6.7, tf: 11.8, r: 8.9,
            A: 58.7, Ixx: 9900, Iyy: 896,
            Zxx: 646, Zyy: 108,
            Sxx: 720, Syy: 165,
            rxx: 13.0, ryy: 3.90,
            J: 32.3, Cw: 1.02
        },
        {
            designation: "305x165x54",
            mass: 54.0, h: 310.4, b: 166.9, tw: 7.9, tf: 13.7, r: 8.9,
            A: 68.8, Ixx: 11700, Iyy: 1060,
            Zxx: 754, Zyy: 127,
            Sxx: 843, Syy: 194,
            rxx: 13.1, ryy: 3.93,
            J: 51.5, Cw: 1.23
        },
        {
            designation: "356x127x33",
            mass: 33.1, h: 349.0, b: 125.4, tw: 6.0, tf: 8.5, r: 10.2,
            A: 42.1, Ixx: 8249, Iyy: 280,
            Zxx: 473, Zyy: 44.7,
            Sxx: 543, Syy: 68.8,
            rxx: 14.0, ryy: 2.58,
            J: 12.8, Cw: 0.432
        },
        {
            designation: "356x127x39",
            mass: 39.1, h: 353.4, b: 126.0, tw: 6.6, tf: 10.7, r: 10.2,
            A: 49.8, Ixx: 10100, Iyy: 358,
            Zxx: 572, Zyy: 56.8,
            Sxx: 659, Syy: 87.5,
            rxx: 14.3, ryy: 2.68,
            J: 25.7, Cw: 0.566
        },
        {
            designation: "356x171x45",
            mass: 45.0, h: 351.4, b: 171.1, tw: 7.0, tf: 9.7, r: 10.2,
            A: 57.3, Ixx: 12100, Iyy: 811,
            Zxx: 687, Zyy: 94.8,
            Sxx: 775, Syy: 146,
            rxx: 14.5, ryy: 3.76,
            J: 21.0, Cw: 1.41
        },
        {
            designation: "356x171x51",
            mass: 51.0, h: 355.0, b: 171.5, tw: 7.4, tf: 11.5, r: 10.2,
            A: 64.9, Ixx: 14100, Iyy: 968,
            Zxx: 796, Zyy: 113,
            Sxx: 895, Syy: 173,
            rxx: 14.8, ryy: 3.86,
            J: 35.0, Cw: 1.71
        },
        {
            designation: "356x171x57",
            mass: 57.0, h: 358.0, b: 172.2, tw: 8.1, tf: 13.0, r: 10.2,
            A: 72.6, Ixx: 16000, Iyy: 1110,
            Zxx: 895, Zyy: 129,
            Sxx: 1010, Syy: 198,
            rxx: 14.9, ryy: 3.91,
            J: 52.3, Cw: 1.98
        },
        {
            designation: "406x140x39",
            mass: 39.0, h: 397.3, b: 141.8, tw: 6.4, tf: 8.6, r: 10.2,
            A: 49.7, Ixx: 12500, Iyy: 410,
            Zxx: 627, Zyy: 57.8,
            Sxx: 718, Syy: 89.2,
            rxx: 15.8, ryy: 2.87,
            J: 16.2, Cw: 0.773
        },
        {
            designation: "406x140x46",
            mass: 46.0, h: 402.3, b: 142.4, tw: 6.8, tf: 11.2, r: 10.2,
            A: 58.6, Ixx: 15700, Iyy: 538,
            Zxx: 781, Zyy: 75.6,
            Sxx: 888, Syy: 116,
            rxx: 16.4, ryy: 3.03,
            J: 35.6, Cw: 1.03
        },
        {
            designation: "406x178x54",
            mass: 54.1, h: 402.6, b: 177.7, tw: 7.7, tf: 10.9, r: 10.2,
            A: 68.4, Ixx: 18700, Iyy: 1020,
            Zxx: 927, Zyy: 115,
            Sxx: 1050, Syy: 176,
            rxx: 16.5, ryy: 3.85,
            J: 35.5, Cw: 2.34
        },
        {
            designation: "406x178x60",
            mass: 60.1, h: 406.4, b: 177.9, tw: 7.9, tf: 12.8, r: 10.2,
            A: 76.5, Ixx: 21600, Iyy: 1200,
            Zxx: 1060, Zyy: 135,
            Sxx: 1200, Syy: 207,
            rxx: 16.8, ryy: 3.96,
            J: 57.6, Cw: 2.80
        },
        {
            designation: "406x178x67",
            mass: 67.1, h: 409.4, b: 178.8, tw: 8.8, tf: 14.3, r: 10.2,
            A: 85.5, Ixx: 24300, Iyy: 1360,
            Zxx: 1190, Zyy: 152,
            Sxx: 1350, Syy: 233,
            rxx: 16.9, ryy: 3.99,
            J: 82.2, Cw: 3.22
        },
        {
            designation: "406x178x74",
            mass: 74.2, h: 412.8, b: 179.5, tw: 9.5, tf: 16.0, r: 10.2,
            A: 94.5, Ixx: 27300, Iyy: 1550,
            Zxx: 1320, Zyy: 172,
            Sxx: 1500, Syy: 265,
            rxx: 17.0, ryy: 4.05,
            J: 116, Cw: 3.72
        },
        {
            designation: "457x152x52",
            mass: 52.3, h: 449.8, b: 152.4, tw: 7.6, tf: 10.9, r: 10.2,
            A: 66.6, Ixx: 21400, Iyy: 645,
            Zxx: 950, Zyy: 84.6,
            Sxx: 1090, Syy: 131,
            rxx: 17.9, ryy: 3.11,
            J: 31.0, Cw: 1.94
        },
        {
            designation: "457x152x60",
            mass: 59.8, h: 454.7, b: 152.9, tw: 8.1, tf: 13.3, r: 10.2,
            A: 76.2, Ixx: 25500, Iyy: 794,
            Zxx: 1120, Zyy: 104,
            Sxx: 1290, Syy: 161,
            rxx: 18.3, ryy: 3.23,
            J: 55.7, Cw: 2.43
        },
        {
            designation: "457x152x67",
            mass: 67.2, h: 458.0, b: 153.8, tw: 9.0, tf: 15.0, r: 10.2,
            A: 85.6, Ixx: 28900, Iyy: 914,
            Zxx: 1260, Zyy: 119,
            Sxx: 1450, Syy: 184,
            rxx: 18.4, ryy: 3.27,
            J: 82.9, Cw: 2.84
        },
        {
            designation: "457x191x67",
            mass: 67.1, h: 453.4, b: 189.9, tw: 8.5, tf: 12.7, r: 10.2,
            A: 85.4, Ixx: 29400, Iyy: 1450,
            Zxx: 1300, Zyy: 153,
            Sxx: 1470, Syy: 235,
            rxx: 18.6, ryy: 4.12,
            J: 51.5, Cw: 4.86
        },
        {
            designation: "457x191x74",
            mass: 74.3, h: 457.0, b: 190.4, tw: 9.0, tf: 14.5, r: 10.2,
            A: 94.6, Ixx: 33300, Iyy: 1670,
            Zxx: 1460, Zyy: 175,
            Sxx: 1650, Syy: 269,
            rxx: 18.8, ryy: 4.20,
            J: 77.8, Cw: 5.67
        },
        {
            designation: "457x191x82",
            mass: 82.0, h: 460.0, b: 191.3, tw: 9.9, tf: 16.0, r: 10.2,
            A: 104, Ixx: 37100, Iyy: 1870,
            Zxx: 1610, Zyy: 195,
            Sxx: 1830, Syy: 300,
            rxx: 18.9, ryy: 4.23,
            J: 111, Cw: 6.46
        },
        {
            designation: "533x210x82",
            mass: 82.2, h: 528.3, b: 208.8, tw: 9.6, tf: 13.2, r: 12.7,
            A: 104, Ixx: 47500, Iyy: 2010,
            Zxx: 1800, Zyy: 192,
            Sxx: 2060, Syy: 296,
            rxx: 21.3, ryy: 4.38,
            J: 60.7, Cw: 8.97
        },
        {
            designation: "533x210x92",
            mass: 92.1, h: 533.1, b: 209.3, tw: 10.2, tf: 15.6, r: 12.7,
            A: 117, Ixx: 55200, Iyy: 2390,
            Zxx: 2070, Zyy: 228,
            Sxx: 2360, Syy: 351,
            rxx: 21.7, ryy: 4.51,
            J: 100, Cw: 10.9
        },
        {
            designation: "533x210x101",
            mass: 101.0, h: 536.7, b: 210.0, tw: 10.8, tf: 17.4, r: 12.7,
            A: 129, Ixx: 61500, Iyy: 2690,
            Zxx: 2290, Zyy: 256,
            Sxx: 2620, Syy: 395,
            rxx: 21.9, ryy: 4.57,
            J: 144, Cw: 12.5
        },
        {
            designation: "610x229x101",
            mass: 101.0, h: 602.6, b: 227.6, tw: 10.6, tf: 14.8, r: 12.7,
            A: 129, Ixx: 75800, Iyy: 2910,
            Zxx: 2520, Zyy: 256,
            Sxx: 2880, Syy: 393,
            rxx: 24.2, ryy: 4.75,
            J: 89.8, Cw: 16.8
        },
        {
            designation: "610x229x113",
            mass: 113.0, h: 607.6, b: 228.2, tw: 11.2, tf: 17.3, r: 12.7,
            A: 144, Ixx: 87300, Iyy: 3430,
            Zxx: 2880, Zyy: 301,
            Sxx: 3290, Syy: 463,
            rxx: 24.6, ryy: 4.88,
            J: 142, Cw: 20.2
        },
        {
            designation: "610x305x149",
            mass: 149.0, h: 612.4, b: 304.8, tw: 11.9, tf: 19.7, r: 16.5,
            A: 190, Ixx: 125000, Iyy: 9310,
            Zxx: 4090, Zyy: 612,
            Sxx: 4590, Syy: 938,
            rxx: 25.7, ryy: 7.00,
            J: 168, Cw: 78.0
        },
    ],

    // -------------------------------------------------------------------------
    // UC — Universal Columns (BS EN 10365)
    // -------------------------------------------------------------------------
    UC: [
        {
            designation: "152x152x23",
            mass: 23.0, h: 152.4, b: 152.2, tw: 5.8, tf: 6.8, r: 7.6,
            A: 29.8, Ixx: 1250, Iyy: 403,
            Zxx: 164, Zyy: 53.0,
            Sxx: 184, Syy: 80.9,
            rxx: 6.51, ryy: 3.68,
            J: 7.83, Cw: 0.0316
        },
        {
            designation: "152x152x30",
            mass: 30.0, h: 157.6, b: 152.9, tw: 6.5, tf: 9.4, r: 7.6,
            A: 38.3, Ixx: 1750, Iyy: 560,
            Zxx: 222, Zyy: 73.3,
            Sxx: 248, Syy: 111,
            rxx: 6.76, ryy: 3.83,
            J: 20.7, Cw: 0.0444
        },
        {
            designation: "152x152x37",
            mass: 37.0, h: 161.8, b: 154.4, tw: 8.1, tf: 11.5, r: 7.6,
            A: 47.1, Ixx: 2210, Iyy: 706,
            Zxx: 274, Zyy: 91.5,
            Sxx: 309, Syy: 140,
            rxx: 6.85, ryy: 3.87,
            J: 37.9, Cw: 0.0571
        },
        {
            designation: "203x203x46",
            mass: 46.1, h: 203.2, b: 203.2, tw: 7.3, tf: 11.0, r: 10.2,
            A: 58.8, Ixx: 4570, Iyy: 1550,
            Zxx: 450, Zyy: 152,
            Sxx: 497, Syy: 231,
            rxx: 8.82, ryy: 5.13,
            J: 30.0, Cw: 0.143
        },
        {
            designation: "203x203x52",
            mass: 52.0, h: 206.2, b: 203.9, tw: 7.9, tf: 12.5, r: 10.2,
            A: 66.4, Ixx: 5260, Iyy: 1780,
            Zxx: 510, Zyy: 175,
            Sxx: 567, Syy: 266,
            rxx: 8.91, ryy: 5.18,
            J: 44.5, Cw: 0.167
        },
        {
            designation: "203x203x60",
            mass: 60.0, h: 209.6, b: 205.8, tw: 9.4, tf: 14.2, r: 10.2,
            A: 75.8, Ixx: 6100, Iyy: 2060,
            Zxx: 582, Zyy: 200,
            Sxx: 652, Syy: 305,
            rxx: 8.97, ryy: 5.21,
            J: 71.5, Cw: 0.196
        },
        {
            designation: "203x203x71",
            mass: 71.0, h: 215.8, b: 206.4, tw: 10.0, tf: 17.3, r: 10.2,
            A: 90.4, Ixx: 7650, Iyy: 2540,
            Zxx: 708, Zyy: 246,
            Sxx: 802, Syy: 376,
            rxx: 9.20, ryy: 5.30,
            J: 126, Cw: 0.247
        },
        {
            designation: "203x203x86",
            mass: 86.0, h: 222.2, b: 209.1, tw: 12.7, tf: 20.5, r: 10.2,
            A: 110, Ixx: 9450, Iyy: 3130,
            Zxx: 851, Zyy: 300,
            Sxx: 977, Syy: 459,
            rxx: 9.28, ryy: 5.34,
            J: 213, Cw: 0.315
        },
        {
            designation: "254x254x73",
            mass: 73.1, h: 254.1, b: 254.6, tw: 8.6, tf: 14.2, r: 12.7,
            A: 93.1, Ixx: 11400, Iyy: 3910,
            Zxx: 895, Zyy: 307,
            Sxx: 992, Syy: 467,
            rxx: 11.1, ryy: 6.48,
            J: 65.9, Cw: 0.564
        },
        {
            designation: "254x254x89",
            mass: 88.9, h: 260.3, b: 255.9, tw: 10.3, tf: 17.3, r: 12.7,
            A: 113, Ixx: 14300, Iyy: 4860,
            Zxx: 1100, Zyy: 381,
            Sxx: 1220, Syy: 580,
            rxx: 11.2, ryy: 6.55,
            J: 118, Cw: 0.717
        },
        {
            designation: "254x254x107",
            mass: 107.0, h: 266.7, b: 258.8, tw: 12.8, tf: 20.5, r: 12.7,
            A: 136, Ixx: 17500, Iyy: 5930,
            Zxx: 1310, Zyy: 459,
            Sxx: 1480, Syy: 700,
            rxx: 11.3, ryy: 6.60,
            J: 199, Cw: 0.898
        },
        {
            designation: "305x305x97",
            mass: 97.1, h: 307.9, b: 304.8, tw: 9.9, tf: 15.4, r: 15.2,
            A: 123, Ixx: 22200, Iyy: 7270,
            Zxx: 1440, Zyy: 477,
            Sxx: 1590, Syy: 726,
            rxx: 13.4, ryy: 7.69,
            J: 109, Cw: 1.56
        },
        {
            designation: "305x305x118",
            mass: 118.0, h: 314.5, b: 306.8, tw: 11.9, tf: 18.7, r: 15.2,
            A: 150, Ixx: 27700, Iyy: 9060,
            Zxx: 1760, Zyy: 591,
            Sxx: 1960, Syy: 901,
            rxx: 13.6, ryy: 7.77,
            J: 196, Cw: 1.98
        },
        {
            designation: "305x305x137",
            mass: 137.0, h: 320.5, b: 309.2, tw: 13.8, tf: 21.7, r: 15.2,
            A: 174, Ixx: 32800, Iyy: 10700,
            Zxx: 2050, Zyy: 694,
            Sxx: 2300, Syy: 1060,
            rxx: 13.7, ryy: 7.83,
            J: 316, Cw: 2.38
        },
        {
            designation: "305x305x158",
            mass: 158.0, h: 327.1, b: 311.2, tw: 15.8, tf: 25.0, r: 15.2,
            A: 201, Ixx: 38700, Iyy: 12600,
            Zxx: 2370, Zyy: 811,
            Sxx: 2680, Syy: 1240,
            rxx: 13.9, ryy: 7.90,
            J: 499, Cw: 2.86
        },
        {
            designation: "356x368x129",
            mass: 129.0, h: 355.6, b: 368.6, tw: 10.4, tf: 17.5, r: 15.2,
            A: 164, Ixx: 40200, Iyy: 14600,
            Zxx: 2260, Zyy: 793,
            Sxx: 2480, Syy: 1200,
            rxx: 15.6, ryy: 9.43,
            J: 165, Cw: 5.17
        },
        {
            designation: "356x368x153",
            mass: 153.0, h: 362.0, b: 370.2, tw: 12.3, tf: 20.7, r: 15.2,
            A: 194, Ixx: 48600, Iyy: 17600,
            Zxx: 2680, Zyy: 952,
            Sxx: 2960, Syy: 1450,
            rxx: 15.8, ryy: 9.52,
            J: 281, Cw: 6.37
        },
        {
            designation: "356x406x235",
            mass: 235.0, h: 381.0, b: 394.8, tw: 18.4, tf: 30.2, r: 15.2,
            A: 299, Ixx: 79100, Iyy: 27700,
            Zxx: 4150, Zyy: 1410,
            Sxx: 4690, Syy: 2160,
            rxx: 16.3, ryy: 9.62,
            J: 1010, Cw: 12.0
        },
        {
            designation: "356x406x393",
            mass: 393.0, h: 419.1, b: 407.0, tw: 30.6, tf: 49.2, r: 15.2,
            A: 500, Ixx: 147000, Iyy: 51400,
            Zxx: 7010, Zyy: 2530,
            Sxx: 8220, Syy: 3880,
            rxx: 17.1, ryy: 10.1,
            J: 7800, Cw: 27.1
        },
        {
            designation: "457x191x89",
            mass: 89.3, h: 463.6, b: 192.8, tw: 10.5, tf: 17.7, r: 10.2,
            A: 113, Ixx: 41100, Iyy: 2090,
            Zxx: 1770, Zyy: 217,
            Sxx: 2010, Syy: 333,
            rxx: 19.0, ryy: 4.29,
            J: 122, Cw: 7.02
        },
        {
            designation: "457x191x98",
            mass: 98.3, h: 467.4, b: 192.8, tw: 11.4, tf: 19.6, r: 10.2,
            A: 125, Ixx: 45700, Iyy: 2330,
            Zxx: 1960, Zyy: 242,
            Sxx: 2230, Syy: 372,
            rxx: 19.1, ryy: 4.33,
            J: 167, Cw: 7.94
        },
    ],

    // -------------------------------------------------------------------------
    // CHS — Circular Hollow Sections (BS EN 10210 / BS EN 10219)
    // Properties calculated per BS EN 1993-1-1
    // d = outer diameter (mm), t = wall thickness (mm)
    // I = Ixx = Iyy (symmetric), J = 2I (polar), Z = Zxx = Zyy
    // -------------------------------------------------------------------------
    CHS: [
        {
            designation: "48.3x4.0",
            mass: 4.37, d: 48.3, t: 4.0,
            A: 5.57, Ixx: 13.8, Iyy: 13.8,
            Zxx: 5.70, Zyy: 5.70,
            Sxx: 7.62, Syy: 7.62,
            rxx: 1.573, ryy: 1.573,
            J: 27.5
        },
        {
            designation: "60.3x4.0",
            mass: 5.55, d: 60.3, t: 4.0,
            A: 7.07, Ixx: 28.2, Iyy: 28.2,
            Zxx: 9.34, Zyy: 9.34,
            Sxx: 12.38, Syy: 12.38,
            rxx: 1.996, ryy: 1.996,
            J: 56.3
        },
        {
            designation: "76.1x4.0",
            mass: 7.11, d: 76.1, t: 4.0,
            A: 9.06, Ixx: 59.1, Iyy: 59.1,
            Zxx: 15.52, Zyy: 15.52,
            Sxx: 20.47, Syy: 20.47,
            rxx: 2.553, ryy: 2.553,
            J: 118.1
        },
        {
            designation: "88.9x4.0",
            mass: 8.38, d: 88.9, t: 4.0,
            A: 10.67, Ixx: 96.3, Iyy: 96.3,
            Zxx: 21.67, Zyy: 21.67,
            Sxx: 28.49, Syy: 28.49,
            rxx: 3.005, ryy: 3.005,
            J: 192.7
        },
        {
            designation: "114.3x4.0",
            mass: 10.88, d: 114.3, t: 4.0,
            A: 13.86, Ixx: 211.1, Iyy: 211.1,
            Zxx: 36.93, Zyy: 36.93,
            Sxx: 48.37, Syy: 48.37,
            rxx: 3.902, ryy: 3.902,
            J: 422.1
        },
        {
            designation: "114.3x6.3",
            mass: 16.78, d: 114.3, t: 6.3,
            A: 21.38, Ixx: 312.7, Iyy: 312.7,
            Zxx: 54.72, Zyy: 54.72,
            Sxx: 72.18, Syy: 72.18,
            rxx: 3.825, ryy: 3.825,
            J: 625.4
        },
        {
            designation: "139.7x5.0",
            mass: 16.61, d: 139.7, t: 5.0,
            A: 21.16, Ixx: 480.5, Iyy: 480.5,
            Zxx: 68.80, Zyy: 68.80,
            Sxx: 90.42, Syy: 90.42,
            rxx: 4.766, ryy: 4.766,
            J: 961.1
        },
        {
            designation: "139.7x8.0",
            mass: 25.98, d: 139.7, t: 8.0,
            A: 33.10, Ixx: 720.3, Iyy: 720.3,
            Zxx: 103.12, Zyy: 103.12,
            Sxx: 136.97, Syy: 136.97,
            rxx: 4.665, ryy: 4.665,
            J: 1440.6
        },
        {
            designation: "168.3x5.0",
            mass: 20.14, d: 168.3, t: 5.0,
            A: 25.65, Ixx: 855.8, Iyy: 855.8,
            Zxx: 101.70, Zyy: 101.70,
            Sxx: 133.72, Syy: 133.72,
            rxx: 5.776, ryy: 5.776,
            J: 1711.7
        },
        {
            designation: "168.3x10.0",
            mass: 39.04, d: 168.3, t: 10.0,
            A: 49.73, Ixx: 1564, Iyy: 1564,
            Zxx: 185.86, Zyy: 185.86,
            Sxx: 247.81, Syy: 247.81,
            rxx: 5.608, ryy: 5.608,
            J: 3128
        },
        {
            designation: "193.7x8.0",
            mass: 36.64, d: 193.7, t: 8.0,
            A: 46.67, Ixx: 2015.5, Iyy: 2015.5,
            Zxx: 208.11, Zyy: 208.11,
            Sxx: 273.93, Syy: 273.93,
            rxx: 6.572, ryy: 6.572,
            J: 4031.1
        },
        {
            designation: "219.1x8.0",
            mass: 41.65, d: 219.1, t: 8.0,
            A: 53.06, Ixx: 2959.6, Iyy: 2959.6,
            Zxx: 270.16, Zyy: 270.16,
            Sxx: 355.28, Syy: 355.28,
            rxx: 7.469, ryy: 7.469,
            J: 5919.3
        },
        {
            designation: "219.1x12.5",
            mass: 63.69, d: 219.1, t: 12.5,
            A: 81.13, Ixx: 4344.6, Iyy: 4344.6,
            Zxx: 396.58, Zyy: 396.58,
            Sxx: 525.89, Syy: 525.89,
            rxx: 7.318, ryy: 7.318,
            J: 8689.2
        },
        {
            designation: "244.5x8.0",
            mass: 46.66, d: 244.5, t: 8.0,
            A: 59.44, Ixx: 4160.4, Iyy: 4160.4,
            Zxx: 340.32, Zyy: 340.32,
            Sxx: 447.14, Syy: 447.14,
            rxx: 8.366, ryy: 8.366,
            J: 8320.9
        },
        {
            designation: "273.0x8.0",
            mass: 52.28, d: 273.0, t: 8.0,
            A: 66.60, Ixx: 5851.7, Iyy: 5851.7,
            Zxx: 428.70, Zyy: 428.70,
            Sxx: 563.37, Syy: 563.37,
            rxx: 9.373, ryy: 9.373,
            J: 11703.4
        },
        {
            designation: "273.0x12.5",
            mass: 80.30, d: 273.0, t: 12.5,
            A: 102.30, Ixx: 8697.4, Iyy: 8697.4,
            Zxx: 637.18, Zyy: 637.18,
            Sxx: 843.07, Syy: 843.07,
            rxx: 9.221, ryy: 9.221,
            J: 17394.9
        },
        {
            designation: "323.9x10.0",
            mass: 77.41, d: 323.9, t: 10.0,
            A: 98.61, Ixx: 12158.3, Iyy: 12158.3,
            Zxx: 750.75, Zyy: 750.75,
            Sxx: 988.36, Syy: 988.36,
            rxx: 11.104, ryy: 11.104,
            J: 24316.7
        },
        {
            designation: "355.6x10.0",
            mass: 85.23, d: 355.6, t: 10.0,
            A: 108.57, Ixx: 16223.5, Iyy: 16223.5,
            Zxx: 912.46, Zyy: 912.46,
            Sxx: 1201.5, Syy: 1201.5,
            rxx: 12.224, ryy: 12.224,
            J: 32447
        },
        {
            designation: "406.4x10.0",
            mass: 97.76, d: 406.4, t: 10.0,
            A: 124.53, Ixx: 24475.8, Iyy: 24475.8,
            Zxx: 1204.52, Zyy: 1204.52,
            Sxx: 1585.5, Syy: 1585.5,
            rxx: 14.019, ryy: 14.019,
            J: 48951.6
        },
        {
            designation: "457.0x12.5",
            mass: 137.03, d: 457.0, t: 12.5,
            A: 174.55, Ixx: 43144.8, Iyy: 43144.8,
            Zxx: 1888.18, Zyy: 1888.18,
            Sxx: 2490.1, Syy: 2490.1,
            rxx: 15.722, ryy: 15.722,
            J: 86289.6
        },
    ],

    // -------------------------------------------------------------------------
    // RHS — Rectangular Hollow Sections (BS EN 10210 / BS EN 10219)
    // H = overall height, B = overall width, t = wall thickness (all mm)
    // -------------------------------------------------------------------------
    RHS: [
        {
            designation: "60x40x4",
            mass: 5.78, H: 60, B: 40, t: 4.0,
            A: 7.36, Ixx: 34.5, Iyy: 17.8,
            Zxx: 11.50, Zyy: 8.90,
            Sxx: 14.37, Syy: 10.69,
            rxx: 2.165, ryy: 1.555,
            J: 35.3
        },
        {
            designation: "80x40x4",
            mass: 7.03, H: 80, B: 40, t: 4.0,
            A: 8.96, Ixx: 71.1, Iyy: 23.0,
            Zxx: 17.78, Zyy: 11.50,
            Sxx: 22.53, Syy: 13.57,
            rxx: 2.818, ryy: 1.602,
            J: 53.5
        },
        {
            designation: "100x50x4",
            mass: 8.92, H: 100, B: 50, t: 4.0,
            A: 11.36, Ixx: 144.1, Iyy: 47.4,
            Zxx: 28.83, Zyy: 18.95,
            Sxx: 36.13, Syy: 21.93,
            rxx: 3.562, ryy: 2.042,
            J: 109.9
        },
        {
            designation: "100x60x4",
            mass: 9.55, H: 100, B: 60, t: 4.0,
            A: 12.16, Ixx: 162.6, Iyy: 72.2,
            Zxx: 32.51, Zyy: 24.07,
            Sxx: 39.97, Syy: 27.81,
            rxx: 3.656, ryy: 2.437,
            J: 152.1
        },
        {
            designation: "120x60x5",
            mass: 13.35, H: 120, B: 60, t: 5.0,
            A: 17.00, Ixx: 309.4, Iyy: 101.4,
            Zxx: 51.57, Zyy: 33.81,
            Sxx: 64.75, Syy: 39.25,
            rxx: 4.266, ryy: 2.442,
            J: 235.3
        },
        {
            designation: "120x80x5",
            mass: 14.91, H: 120, B: 80, t: 5.0,
            A: 19.00, Ixx: 375.6, Iyy: 197.6,
            Zxx: 62.60, Zyy: 49.40,
            Sxx: 76.25, Syy: 57.25,
            rxx: 4.446, ryy: 3.225,
            J: 391.5
        },
        {
            designation: "150x100x5",
            mass: 18.84, H: 150, B: 100, t: 5.0,
            A: 24.00, Ixx: 754.5, Iyy: 399.5,
            Zxx: 100.60, Zyy: 79.90,
            Sxx: 121.50, Syy: 91.50,
            rxx: 5.607, ryy: 4.080,
            J: 790.6
        },
        {
            designation: "150x100x8",
            mass: 29.39, H: 150, B: 100, t: 8.0,
            A: 37.44, Ixx: 1128.2, Iyy: 588.1,
            Zxx: 150.43, Zyy: 117.63,
            Sxx: 185.42, Syy: 138.62,
            rxx: 5.489, ryy: 3.963,
            J: 1167.0
        },
        {
            designation: "160x80x6",
            mass: 21.48, H: 160, B: 80, t: 6.0,
            A: 27.36, Ixx: 893.7, Iyy: 294.9,
            Zxx: 111.71, Zyy: 73.72,
            Sxx: 139.63, Syy: 84.91,
            rxx: 5.715, ryy: 3.283,
            J: 683.5
        },
        {
            designation: "180x100x6",
            mass: 25.25, H: 180, B: 100, t: 6.0,
            A: 32.16, Ixx: 1382.8, Iyy: 545.9,
            Zxx: 153.64, Zyy: 109.19,
            Sxx: 189.07, Syy: 124.75,
            rxx: 6.557, ryy: 4.120,
            J: 1197.8
        },
        {
            designation: "200x100x6",
            mass: 27.13, H: 200, B: 100, t: 6.0,
            A: 34.56, Ixx: 1793.9, Iyy: 599.0,
            Zxx: 179.39, Zyy: 119.81,
            Sxx: 222.43, Syy: 136.03,
            rxx: 7.205, ryy: 4.163,
            J: 1385.6
        },
        {
            designation: "200x100x8",
            mass: 35.67, H: 200, B: 100, t: 8.0,
            A: 45.44, Ixx: 2306.0, Iyy: 757.9,
            Zxx: 230.60, Zyy: 151.57,
            Sxx: 289.02, Syy: 175.42,
            rxx: 7.124, ryy: 4.084,
            J: 1757.8
        },
        {
            designation: "200x150x8",
            mass: 41.95, H: 200, B: 150, t: 8.0,
            A: 53.44, Ixx: 3043.7, Iyy: 1935.6,
            Zxx: 304.37, Zyy: 258.09,
            Sxx: 365.82, Syy: 299.02,
            rxx: 7.547, ryy: 6.018,
            J: 3560.8
        },
        {
            designation: "250x150x8",
            mass: 48.23, H: 250, B: 150, t: 8.0,
            A: 61.44, Ixx: 5223.5, Iyy: 2339.3,
            Zxx: 417.88, Zyy: 311.91,
            Sxx: 509.42, Syy: 355.82,
            rxx: 9.221, ryy: 6.171,
            J: 4920.4
        },
        {
            designation: "250x150x10",
            mass: 59.66, H: 250, B: 150, t: 10.0,
            A: 76.00, Ixx: 6350.3, Iyy: 2820.3,
            Zxx: 508.03, Zyy: 376.04,
            Sxx: 624.50, Syy: 434.50,
            rxx: 9.141, ryy: 6.092,
            J: 5941.9
        },
        {
            designation: "300x150x8",
            mass: 54.51, H: 300, B: 150, t: 8.0,
            A: 69.44, Ixx: 8171.3, Iyy: 2743.1,
            Zxx: 544.75, Zyy: 365.74,
            Sxx: 673.02, Syy: 412.62,
            rxx: 10.848, ryy: 6.285,
            J: 6338.3
        },
        {
            designation: "300x200x8",
            mass: 60.79, H: 300, B: 200, t: 8.0,
            A: 77.44, Ixx: 9877.0, Iyy: 5256.8,
            Zxx: 658.47, Zyy: 525.68,
            Sxx: 789.82, Syy: 596.22,
            rxx: 11.294, ryy: 8.239,
            J: 10390.7
        },
        {
            designation: "300x200x10",
            mass: 75.36, H: 300, B: 200, t: 10.0,
            A: 96.00, Ixx: 12072.0, Iyy: 6392.0,
            Zxx: 804.80, Zyy: 639.20,
            Sxx: 972.00, Syy: 732.00,
            rxx: 11.214, ryy: 8.160,
            J: 12650.0
        },
        {
            designation: "400x200x10",
            mass: 91.06, H: 400, B: 200, t: 10.0,
            A: 116.00, Ixx: 24358.7, Iyy: 8198.7,
            Zxx: 1217.93, Zyy: 819.87,
            Sxx: 1502.00, Syy: 922.00,
            rxx: 14.491, ryy: 8.407,
            J: 18933.8
        },
        {
            designation: "400x200x12.5",
            mass: 112.84, H: 400, B: 200, t: 12.5,
            A: 143.75, Ixx: 29762.4, Iyy: 9918.6,
            Zxx: 1488.12, Zyy: 991.86,
            Sxx: 1847.66, Syy: 1128.91,
            rxx: 14.389, ryy: 8.307,
            J: 22951.9
        },
        {
            designation: "500x300x10",
            mass: 122.46, H: 500, B: 300, t: 10.0,
            A: 156.00, Ixx: 54452.0, Iyy: 24692.0,
            Zxx: 2178.08, Zyy: 1646.13,
            Sxx: 2622.00, Syy: 1842.00,
            rxx: 18.683, ryy: 12.581,
            J: 51775.4
        },
        {
            designation: "500x300x12.5",
            mass: 152.09, H: 500, B: 300, t: 12.5,
            A: 193.75, Ixx: 66897.8, Iyy: 30179.0,
            Zxx: 2675.91, Zyy: 2011.94,
            Sxx: 3238.28, Syy: 2269.53,
            rxx: 18.582, ryy: 12.480,
            J: 63367.0
        },
    ],

    // -------------------------------------------------------------------------
    // SHS — Square Hollow Sections (BS EN 10210 / BS EN 10219)
    // H = overall height = overall width, t = wall thickness (all mm)
    // -------------------------------------------------------------------------
    SHS: [
        {
            designation: "40x40x4",
            mass: 4.52, H: 40, B: 40, t: 4.0,
            A: 5.76, Ixx: 12.6, Iyy: 12.6,
            Zxx: 6.30, Zyy: 6.30,
            Sxx: 7.81, Syy: 7.81,
            rxx: 1.479, ryy: 1.479,
            J: 18.7
        },
        {
            designation: "50x50x4",
            mass: 5.78, H: 50, B: 50, t: 4.0,
            A: 7.36, Ixx: 26.2, Iyy: 26.2,
            Zxx: 10.46, Zyy: 10.46,
            Sxx: 12.73, Syy: 12.73,
            rxx: 1.885, ryy: 1.885,
            J: 38.9
        },
        {
            designation: "60x60x4",
            mass: 7.03, H: 60, B: 60, t: 4.0,
            A: 8.96, Ixx: 47.1, Iyy: 47.1,
            Zxx: 15.69, Zyy: 15.69,
            Sxx: 18.85, Syy: 18.85,
            rxx: 2.292, ryy: 2.292,
            J: 70.2
        },
        {
            designation: "70x70x5",
            mass: 10.21, H: 70, B: 70, t: 5.0,
            A: 13.00, Ixx: 92.1, Iyy: 92.1,
            Zxx: 26.31, Zyy: 26.31,
            Sxx: 31.75, Syy: 31.75,
            rxx: 2.661, ryy: 2.661,
            J: 137.3
        },
        {
            designation: "80x80x5",
            mass: 11.78, H: 80, B: 80, t: 5.0,
            A: 15.00, Ixx: 141.3, Iyy: 141.3,
            Zxx: 35.31, Zyy: 35.31,
            Sxx: 42.25, Syy: 42.25,
            rxx: 3.069, ryy: 3.069,
            J: 210.9
        },
        {
            designation: "90x90x5",
            mass: 13.35, H: 90, B: 90, t: 5.0,
            A: 17.00, Ixx: 205.4, Iyy: 205.4,
            Zxx: 45.65, Zyy: 45.65,
            Sxx: 54.25, Syy: 54.25,
            rxx: 3.476, ryy: 3.476,
            J: 307.1
        },
        {
            designation: "100x100x5",
            mass: 14.91, H: 100, B: 100, t: 5.0,
            A: 19.00, Ixx: 286.6, Iyy: 286.6,
            Zxx: 57.32, Zyy: 57.32,
            Sxx: 67.75, Syy: 67.75,
            rxx: 3.884, ryy: 3.884,
            J: 428.7
        },
        {
            designation: "100x100x8",
            mass: 23.11, H: 100, B: 100, t: 8.0,
            A: 29.44, Ixx: 418.4, Iyy: 418.4,
            Zxx: 83.69, Zyy: 83.69,
            Sxx: 101.82, Syy: 101.82,
            rxx: 3.770, ryy: 3.770,
            J: 623.0
        },
        {
            designation: "120x120x6",
            mass: 21.48, H: 120, B: 120, t: 6.0,
            A: 27.36, Ixx: 594.3, Iyy: 594.3,
            Zxx: 99.04, Zyy: 99.04,
            Sxx: 117.07, Syy: 117.07,
            rxx: 4.660, ryy: 4.660,
            J: 888.9
        },
        {
            designation: "120x120x8",
            mass: 28.13, H: 120, B: 120, t: 8.0,
            A: 35.84, Ixx: 753.1, Iyy: 753.1,
            Zxx: 125.52, Zyy: 125.52,
            Sxx: 150.78, Syy: 150.78,
            rxx: 4.584, ryy: 4.584,
            J: 1123.9
        },
        {
            designation: "150x150x6",
            mass: 27.13, H: 150, B: 150, t: 6.0,
            A: 34.56, Ixx: 1196.5, Iyy: 1196.5,
            Zxx: 159.53, Zyy: 159.53,
            Sxx: 186.73, Syy: 186.73,
            rxx: 5.884, ryy: 5.884,
            J: 1791.6
        },
        {
            designation: "150x150x8",
            mass: 35.67, H: 150, B: 150, t: 8.0,
            A: 45.44, Ixx: 1531.9, Iyy: 1531.9,
            Zxx: 204.26, Zyy: 204.26,
            Sxx: 242.22, Syy: 242.22,
            rxx: 5.806, ryy: 5.806,
            J: 2290.6
        },
        {
            designation: "150x150x10",
            mass: 43.96, H: 150, B: 150, t: 10.0,
            A: 56.00, Ixx: 1838.7, Iyy: 1838.7,
            Zxx: 245.16, Zyy: 245.16,
            Sxx: 294.50, Syy: 294.50,
            rxx: 5.730, ryy: 5.730,
            J: 2744.0
        },
        {
            designation: "180x180x8",
            mass: 43.21, H: 180, B: 180, t: 8.0,
            A: 55.04, Ixx: 2719.7, Iyy: 2719.7,
            Zxx: 302.19, Zyy: 302.19,
            Sxx: 355.26, Syy: 355.26,
            rxx: 7.029, ryy: 7.029,
            J: 4070.8
        },
        {
            designation: "200x200x8",
            mass: 48.23, H: 200, B: 200, t: 8.0,
            A: 61.44, Ixx: 3781.4, Iyy: 3781.4,
            Zxx: 378.14, Zyy: 378.14,
            Sxx: 442.62, Syy: 442.62,
            rxx: 7.845, ryy: 7.845,
            J: 5662.3
        },
        {
            designation: "200x200x10",
            mass: 59.66, H: 200, B: 200, t: 10.0,
            A: 76.00, Ixx: 4585.3, Iyy: 4585.3,
            Zxx: 458.53, Zyy: 458.53,
            Sxx: 542.00, Syy: 542.00,
            rxx: 7.767, ryy: 7.767,
            J: 6859.0
        },
        {
            designation: "250x250x10",
            mass: 75.36, H: 250, B: 250, t: 10.0,
            A: 96.00, Ixx: 9232.0, Iyy: 9232.0,
            Zxx: 738.56, Zyy: 738.56,
            Sxx: 864.50, Syy: 864.50,
            rxx: 9.806, ryy: 9.806,
            J: 13824.0
        },
        {
            designation: "250x250x12.5",
            mass: 93.22, H: 250, B: 250, t: 12.5,
            A: 118.75, Ixx: 11194.7, Iyy: 11194.7,
            Zxx: 895.57, Zyy: 895.57,
            Sxx: 1058.59, Syy: 1058.59,
            rxx: 9.709, ryy: 9.709,
            J: 16745.6
        },
        {
            designation: "300x300x10",
            mass: 91.06, H: 300, B: 300, t: 10.0,
            A: 116.00, Ixx: 16278.7, Iyy: 16278.7,
            Zxx: 1085.24, Zyy: 1085.24,
            Sxx: 1262.00, Syy: 1262.00,
            rxx: 11.846, ryy: 11.846,
            J: 24389.0
        },
        {
            designation: "300x300x12.5",
            mass: 112.84, H: 300, B: 300, t: 12.5,
            A: 143.75, Ixx: 19840.5, Iyy: 19840.5,
            Zxx: 1322.70, Zyy: 1322.70,
            Sxx: 1550.78, Syy: 1550.78,
            rxx: 11.748, ryy: 11.748,
            J: 29704.6
        },
    ],
};
