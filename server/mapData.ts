import { Door, FloorId, HidingSpot, Item, ItemType } from '../src/types/game.js';

export interface WallRect {
  x: number;
  y: number;
  width: number;
  height: number;
  floor: FloorId;
}

export interface TransitionStair {
  id: string;
  fromFloor: FloorId;
  toFloor: FloorId;
  x: number;
  y: number;
  radius: number;
  targetX: number;
  targetY: number;
  label: string;
  labelAr: string;
}

// 1200 x 800 dimensions per floor
export const HOUSE_WIDTH = 1200;
export const HOUSE_HEIGHT = 800;

export const INITIAL_WALLS: WallRect[] = [
  // Outer boundary walls for each floor
  ...([0, 1, 2] as FloorId[]).flatMap((f) => [
    { x: 0, y: 0, width: HOUSE_WIDTH, height: 24, floor: f },
    { x: 0, y: HOUSE_HEIGHT - 24, width: HOUSE_WIDTH, height: 24, floor: f },
    { x: 0, y: 0, width: 24, height: HOUSE_HEIGHT, floor: f },
    { x: HOUSE_WIDTH - 24, y: 0, width: 24, height: HOUSE_HEIGHT, floor: f },
  ]),

  // FLOOR 1 (Ground Floor) Interior Walls:
  // Center hallway dividing living room and kitchen/dining
  { x: 420, y: 24, width: 20, height: 260, floor: 1 },
  { x: 420, y: 380, width: 20, height: 396, floor: 1 }, // Door gap at y: 284-380
  { x: 780, y: 24, width: 20, height: 320, floor: 1 },
  { x: 780, y: 440, width: 20, height: 336, floor: 1 }, // Door gap at y: 344-440
  { x: 24, y: 400, width: 400, height: 20, floor: 1 }, // Living room bottom divider
  { x: 780, y: 350, width: 396, height: 20, floor: 1 }, // Dining room bottom divider

  // FLOOR 0 (Basement) Interior Walls:
  { x: 500, y: 24, width: 20, height: 450, floor: 0 },
  { x: 24, y: 420, width: 480, height: 20, floor: 0 }, // Dungeon cell
  { x: 500, y: 550, width: 20, height: 226, floor: 0 }, // Door gap at y: 474-550
  { x: 750, y: 300, width: 426, height: 20, floor: 0 }, // Secret tunnel divider
  { x: 880, y: 320, width: 20, height: 456, floor: 0 }, // Sewer gate area

  // FLOOR 2 (Upper Floor) Interior Walls:
  { x: 400, y: 24, width: 20, height: 350, floor: 2 },
  { x: 400, y: 470, width: 20, height: 306, floor: 2 }, // Gap y: 370-470
  { x: 24, y: 380, width: 380, height: 20, floor: 2 }, // Master bedroom bottom
  { x: 800, y: 24, width: 20, height: 420, floor: 2 },
  { x: 800, y: 540, width: 20, height: 236, floor: 2 }, // Gap y: 440-540
  { x: 800, y: 400, width: 376, height: 20, floor: 2 }, // Bathroom divider
];

export const INITIAL_DOORS: Record<string, Door> = {
  // Main escape front door on Floor 1
  door_main: {
    id: 'door_main',
    x: 600,
    y: 776,
    floor: 1,
    width: 90,
    height: 24,
    isOpen: false,
    isLocked: true,
    requiredKey: 'master_key',
    label: 'Main Exit Door',
    labelAr: 'الباب الرئيسي للخروج',
  },
  door_kitchen: {
    id: 'door_kitchen',
    x: 420,
    y: 300,
    floor: 1,
    width: 20,
    height: 80,
    isOpen: false,
    isLocked: false,
    label: 'Kitchen Door',
    labelAr: 'باب المطبخ',
  },
  door_foyer_dining: {
    id: 'door_foyer_dining',
    x: 780,
    y: 360,
    floor: 1,
    width: 20,
    height: 80,
    isOpen: false,
    isLocked: false,
    label: 'Dining Room Door',
    labelAr: 'باب غرفة الطعام',
  },
  door_safe_room: {
    id: 'door_safe_room',
    x: 200,
    y: 400,
    floor: 1,
    width: 80,
    height: 20,
    isOpen: false,
    isLocked: true,
    requiredKey: 'safe_key',
    label: 'Safe Room Door',
    labelAr: 'باب غرفة الخزنة',
  },
  // Basement doors
  door_cell: {
    id: 'door_cell',
    x: 240,
    y: 420,
    floor: 0,
    width: 80,
    height: 20,
    isOpen: false,
    isLocked: true,
    requiredKey: 'padlock_key',
    label: 'Prison Cell Door',
    labelAr: 'باب الزنزانة',
  },
  door_garage: {
    id: 'door_garage',
    x: 500,
    y: 470,
    floor: 0,
    width: 20,
    height: 80,
    isOpen: false,
    isLocked: false,
    label: 'Basement Garage Door',
    labelAr: 'باب كراج القبو',
  },
  door_sewer_gate: {
    id: 'door_sewer_gate',
    x: 880,
    y: 500,
    floor: 0,
    width: 20,
    height: 90,
    isOpen: false,
    isLocked: true,
    requiredKey: 'sewer_key',
    label: 'Sewer Tunnel Gate',
    labelAr: 'بوابة نفق الصرف الصحي',
  },
  // Floor 2 doors
  door_master_bedroom: {
    id: 'door_master_bedroom',
    x: 400,
    y: 380,
    floor: 2,
    width: 20,
    height: 80,
    isOpen: false,
    isLocked: false,
    label: 'Master Bedroom Door',
    labelAr: 'باب غرفة النوم الرئيسية',
  },
  door_bathroom: {
    id: 'door_bathroom',
    x: 800,
    y: 450,
    floor: 2,
    width: 20,
    height: 80,
    isOpen: false,
    isLocked: false,
    label: 'Bathroom Door',
    labelAr: 'باب الحمام',
  },
};

export const INITIAL_HIDING_SPOTS: Record<string, HidingSpot> = {
  // Floor 1
  hide_wardrobe_foyer: {
    id: 'hide_wardrobe_foyer',
    type: 'wardrobe',
    x: 520,
    y: 120,
    floor: 1,
    width: 70,
    height: 45,
    label: 'Hallway Wardrobe',
    labelAr: 'خزانة المدخل',
  },
  hide_wardrobe_living: {
    id: 'hide_wardrobe_living',
    type: 'wardrobe',
    x: 100,
    y: 80,
    floor: 1,
    width: 70,
    height: 45,
    label: 'Living Room Wardrobe',
    labelAr: 'خزانة غرفة المعيشة',
  },
  // Floor 2
  hide_bed_master: {
    id: 'hide_bed_master',
    type: 'bed',
    x: 180,
    y: 180,
    floor: 2,
    width: 90,
    height: 120,
    label: 'Under Master Bed',
    labelAr: 'تحت السرير الكبير',
  },
  hide_wardrobe_master: {
    id: 'hide_wardrobe_master',
    type: 'wardrobe',
    x: 80,
    y: 80,
    floor: 2,
    width: 70,
    height: 45,
    label: 'Bedroom Closet',
    labelAr: 'خزانة غرفة النوم',
  },
  hide_wardrobe_attic: {
    id: 'hide_wardrobe_attic',
    type: 'wardrobe',
    x: 1050,
    y: 100,
    floor: 2,
    width: 70,
    height: 45,
    label: 'Attic Wardrobe',
    labelAr: 'خزانة العلية',
  },
  // Floor 0
  hide_cell_bed: {
    id: 'hide_cell_bed',
    type: 'bed',
    x: 120,
    y: 600,
    floor: 0,
    width: 80,
    height: 110,
    label: 'Under Rusty Cell Bed',
    labelAr: 'تحت سرير الزنزانة',
  },
  hide_garage_closet: {
    id: 'hide_garage_closet',
    type: 'wardrobe',
    x: 640,
    y: 80,
    floor: 0,
    width: 70,
    height: 45,
    label: 'Tool Locker',
    labelAr: 'خزانة الأدوات',
  },
};

export const TRANSITION_STAIRS: TransitionStair[] = [
  // Ground (1) to Basement (0)
  {
    id: 'stairs_1_to_0',
    fromFloor: 1,
    toFloor: 0,
    x: 180,
    y: 720,
    radius: 50,
    targetX: 180,
    targetY: 720,
    label: 'Stairs down to Basement',
    labelAr: 'الدرج المؤدي إلى القبو',
  },
  // Basement (0) to Ground (1)
  {
    id: 'stairs_0_to_1',
    fromFloor: 0,
    toFloor: 1,
    x: 180,
    y: 720,
    radius: 50,
    targetX: 180,
    targetY: 720,
    label: 'Stairs up to Ground Floor',
    labelAr: 'الدرج المؤدي إلى الطابق الأرضي',
  },
  // Ground (1) to Upper (2)
  {
    id: 'stairs_1_to_2',
    fromFloor: 1,
    toFloor: 2,
    x: 1050,
    y: 180,
    radius: 50,
    targetX: 1050,
    targetY: 180,
    label: 'Stairs up to 2nd Floor',
    labelAr: 'الدرج المؤدي إلى الطابق الثاني',
  },
  // Upper (2) to Ground (1)
  {
    id: 'stairs_2_to_1',
    fromFloor: 2,
    toFloor: 1,
    x: 1050,
    y: 180,
    radius: 50,
    targetX: 1050,
    targetY: 180,
    label: 'Stairs down to Ground Floor',
    labelAr: 'الدرج المؤدي إلى الطابق الأرضي',
  },
  // Secret drop chute: Upper (2) attic vent drops to Floor 1 Kitchen!
  {
    id: 'chute_2_to_1',
    fromFloor: 2,
    toFloor: 1,
    x: 600,
    y: 300,
    radius: 40,
    targetX: 600,
    targetY: 300,
    label: 'Drop down through Secret Chute',
    labelAr: 'القفز عبر فتحة التهوية السرية للمطبخ',
  },
];

// Items generator with randomized locations
export function generateMatchItems(): Record<string, Item> {
  const itemTemplates: { type: ItemType; name: string; nameAr: string; desc: string; descAr: string }[] = [
    { type: 'padlock_key', name: 'Padlock Key (Gold)', nameAr: 'مفتاح القفل الذهبي', desc: 'Unlocks golden padlocks and main gate', descAr: 'يفتح الأقفال الذهبية وباب الخروج' },
    { type: 'master_key', name: 'Master Key (Red)', nameAr: 'المفتاح الرئيسي الأحمر', desc: 'Required for main exit door', descAr: 'مطلوب لباب الخروج الرئيسي' },
    { type: 'sewer_key', name: 'Sewer Key (Rusty)', nameAr: 'مفتاح الصرف الصحي', desc: 'Unlocks underground escape gate', descAr: 'يفتح بوابة نفق الهروب السفلي' },
    { type: 'safe_key', name: 'Safe Key', nameAr: 'مفتاح الخزنة', desc: 'Opens secret safe containing emergency tools', descAr: 'يفتح الخزنة السرية التي تحتوي على أدوات' },
    { type: 'crowbar', name: 'Heavy Crowbar', nameAr: 'عتلة خلع الأخشاب', desc: 'Pries wooden planks blocking exits', descAr: 'تخلع الألواح الخشبية المعترضة لطرق الخروج' },
    { type: 'pliers', name: 'Cutting Pliers', nameAr: 'كماشة قطع الأسلاك', desc: 'Cuts alarm circuit wires and disarms traps', descAr: 'تقطع أسلاك جهاز الإنذار وتفك فخاخ الدببة' },
    { type: 'medkit', name: 'First Aid Medkit', nameAr: 'حقيبة إسعافات أولية', desc: 'Revives downed teammates instantly', descAr: 'تنعش اللاعب المصاب المطروح على الأرض' },
    { type: 'tranquilizer_shotgun', name: 'Tranquilizer Gun', nameAr: 'بندقية التخدير', desc: 'Shoots Granny and stuns her for 20 seconds!', descAr: 'تخدر غرانّي وتوقفها لمدة 20 ثانية!' },
    { type: 'pepper_spray', name: 'Pepper Spray', nameAr: 'بخاخ الفلفل الدفاعي', desc: 'Blinds Granny temporarily when she gets close', descAr: 'يعمي غرانّي مؤقتاً عند اقترابها' },
    { type: 'car_battery', name: 'Car Battery', nameAr: 'بطارية السيارة', desc: 'Provides electric power to the escape car', descAr: 'تزود سيارة الهروب بالطاقة الكهربائية' },
    { type: 'spark_plug', name: 'Spark Plug', nameAr: 'شمعة الإشعال (بوجيه)', desc: 'Ignition part for car engine', descAr: 'قطعة إشعال لمحرك سيارة الهروب' },
    { type: 'gasoline_can', name: 'Gasoline Can', nameAr: 'جركن بنزين', desc: 'Fuel needed to start the escape car', descAr: 'وقود لتشغيل سيارة الهروب في القبو' },
    { type: 'car_key', name: 'Car Key', nameAr: 'مفتاح السيارة', desc: 'Starts the car ignition and unlocks trunk', descAr: 'يشغل محرك سيارة الهروب ويفتح الصندوق' },
    { type: 'cogwheel', name: 'Iron Cogwheel', nameAr: 'ترس ميكانيكي', desc: 'Used to crank the sewer winch gate', descAr: 'يدير رافعة بوابة نفق الهروب' },
    { type: 'alarm_clock', name: 'Wind-up Alarm Clock', nameAr: 'منبه ميكانيكي', desc: 'Make noise to distract Granny to another room', descAr: 'يحدث صوتاً عالياً لتشتيت غرانّي بعيداً' },
  ];

  // Possible spawn coordinate points across 3 floors
  const spawnPoints: { x: number; y: number; floor: FloorId }[] = [
    // Floor 0 (Basement)
    { x: 300, y: 300, floor: 0 },
    { x: 120, y: 480, floor: 0 },
    { x: 420, y: 700, floor: 0 },
    { x: 700, y: 200, floor: 0 },
    { x: 800, y: 650, floor: 0 },
    { x: 1050, y: 700, floor: 0 },
    // Floor 1 (Ground)
    { x: 260, y: 200, floor: 1 },
    { x: 150, y: 550, floor: 1 },
    { x: 350, y: 700, floor: 1 },
    { x: 920, y: 150, floor: 1 },
    { x: 1000, y: 600, floor: 1 },
    { x: 600, y: 450, floor: 1 },
    // Floor 2 (Upper)
    { x: 120, y: 260, floor: 2 },
    { x: 280, y: 120, floor: 2 },
    { x: 250, y: 650, floor: 2 },
    { x: 600, y: 650, floor: 2 },
    { x: 920, y: 280, floor: 2 },
    { x: 1080, y: 650, floor: 2 },
    { x: 600, y: 150, floor: 2 },
  ];

  // Shuffle spawn points
  const shuffledPoints = [...spawnPoints].sort(() => Math.random() - 0.5);

  const items: Record<string, Item> = {};
  itemTemplates.forEach((tmpl, idx) => {
    const pt = shuffledPoints[idx % shuffledPoints.length];
    const id = `item_${tmpl.type}_${idx}`;
    items[id] = {
      id,
      type: tmpl.type,
      name: tmpl.name,
      nameAr: tmpl.nameAr,
      x: pt.x + (Math.random() * 40 - 20),
      y: pt.y + (Math.random() * 40 - 20),
      floor: pt.floor,
      description: tmpl.desc,
      descriptionAr: tmpl.descAr,
    };
  });

  return items;
}
