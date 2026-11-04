export const FLOOR_Y = {
  ground: 0,
  upper: 3.4,
  basement: -3.6,
  attic: 6.7,
};

export const FLOOR_LABEL = {
  ground: 'GROUND FLOOR',
  upper: 'UPPER FLOOR',
  basement: 'BASEMENT',
  attic: 'BELL LOFT',
};

export const ROOMS = [
  // Ground floor
  { id: 'intake', name: 'INTAKE', floor: 'ground', x1: -16, x2: -10, z1: 1, z2: 8, h: 3.1, floorMat: 'woodFloor', wallMat: 'plaster', ceilMat: 'plaster' },
  { id: 'reception', name: 'RECEPTION', floor: 'ground', x1: -10, x2: -4, z1: 1, z2: 8, h: 3.1, floorMat: 'woodFloor', wallMat: 'wallpaper', ceilMat: 'plaster' },
  { id: 'day', name: 'DAY ROOM', floor: 'ground', x1: -10, x2: -4, z1: -8, z2: 1, h: 3.2, floorMat: 'carpet', wallMat: 'wallpaper', ceilMat: 'plaster' },
  { id: 'treatment', name: 'TREATMENT', floor: 'ground', x1: -16, x2: -10, z1: -8, z2: 1, h: 3.2, floorMat: 'whiteTile', wallMat: 'whiteTile', ceilMat: 'plaster' },
  { id: 'foyer', name: 'GRAND FOYER', floor: 'ground', x1: -4, x2: 4, z1: -3, z2: 8, h: 6.3, floorMat: 'parquet', wallMat: 'wallpaper', ceilMat: 'plaster' },
  { id: 'archive', name: 'ARCHIVE', floor: 'ground', x1: -4, x2: 4, z1: -12, z2: -3, h: 3.2, floorMat: 'woodFloor', wallMat: 'plaster', ceilMat: 'plaster' },
  { id: 'office', name: 'MATRON’S OFFICE', floor: 'ground', x1: 4, x2: 10, z1: -12, z2: -3, h: 3.2, floorMat: 'carpet', wallMat: 'wallpaper', ceilMat: 'plaster' },
  { id: 'records', name: 'RECORDS', floor: 'ground', x1: 10, x2: 16, z1: -12, z2: -3, h: 3.1, floorMat: 'woodFloor', wallMat: 'plaster', ceilMat: 'plaster' },
  { id: 'corridor', name: 'EAST CORRIDOR', floor: 'ground', x1: 4, x2: 7, z1: -3, z2: 8, h: 3.2, floorMat: 'woodFloor', wallMat: 'plaster', ceilMat: 'plaster' },
  { id: 'dining', name: 'DINING', floor: 'ground', x1: 7, x2: 14, z1: 1, z2: 8, h: 3.1, floorMat: 'woodFloor', wallMat: 'wallpaper', ceilMat: 'plaster' },
  { id: 'kitchen', name: 'KITCHEN', floor: 'ground', x1: 7, x2: 14, z1: -3, z2: 1, h: 3.1, floorMat: 'tile', wallMat: 'tile', ceilMat: 'plaster' },

  // Upper floor
  { id: 'ward', name: 'PATIENT WARD', floor: 'upper', x1: -10, x2: 2.5, z1: -12, z2: -3, h: 3.1, floorMat: 'woodFloor', wallMat: 'wallpaper', ceilMat: 'plaster' },
  { id: 'observation', name: 'OBSERVATION', floor: 'upper', x1: -10, x2: 2.5, z1: -19, z2: -12, h: 3.1, floorMat: 'tile', wallMat: 'plaster', ceilMat: 'plaster' },
  { id: 'quarters', name: 'MATRON’S QUARTERS', floor: 'upper', x1: 4, x2: 10, z1: -19, z2: -12, h: 3.1, floorMat: 'carpet', wallMat: 'wallpaper', ceilMat: 'plaster' },
  { id: 'hall', name: 'UPPER HALL', floor: 'upper', x1: 2.5, x2: 4, z1: -19, z2: -12, h: 3.15, floorMat: 'woodFloor', wallMat: 'plaster', ceilMat: 'plaster', openWest: false },
  { id: 'balcony', name: 'GRAND BALCONY', floor: 'upper', x1: 2.5, x2: 4, z1: -12, z2: 1.5, h: 3.2, floorMat: 'parquet', wallMat: 'wallpaper', ceilMat: 'plaster', openWest: true },

  // Basement
  { id: 'landing', name: 'SERVICE LANDING', floor: 'basement', x1: -4, x2: 4, z1: -8, z2: 0, h: 3.0, floorMat: 'concrete', wallMat: 'basement', ceilMat: 'concrete' },
  { id: 'workshop', name: 'WORKSHOP', floor: 'basement', x1: -10, x2: -4, z1: -8, z2: 0, h: 3.0, floorMat: 'concrete', wallMat: 'basement', ceilMat: 'concrete' },
  { id: 'generator', name: 'GENERATOR', floor: 'basement', x1: 4, x2: 10, z1: -8, z2: 0, h: 3.0, floorMat: 'concrete', wallMat: 'basement', ceilMat: 'concrete' },
  { id: 'cellar', name: 'CELLAR', floor: 'basement', x1: -10, x2: 10, z1: -14, z2: -8, h: 3.0, floorMat: 'concrete', wallMat: 'basement', ceilMat: 'concrete' },
  { id: 'laundry', name: 'LAUNDRY', floor: 'basement', x1: -10, x2: -4, z1: -20, z2: -14, h: 3.0, floorMat: 'tile', wallMat: 'tile', ceilMat: 'concrete' },
  { id: 'boiler', name: 'BOILER', floor: 'basement', x1: 4, x2: 10, z1: -20, z2: -14, h: 3.0, floorMat: 'concrete', wallMat: 'basement', ceilMat: 'concrete' },

  // Secret loft
  { id: 'attic', name: 'BELL LOFT', floor: 'attic', x1: -4, x2: 2.4, z1: -18, z2: -13, h: 2.8, floorMat: 'atticWood', wallMat: 'darkWood', ceilMat: 'darkWood' },
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room]));

export const DOORS = [
  { id: 'front', rooms: ['foyer'], axis: 'z', at: 8, center: 0, width: 2.4, kind: 'double', initialOpen: false, locked: 'bell' },
  { id: 'intake_reception', rooms: ['intake', 'reception'], axis: 'x', at: -10, center: 4.5, width: 1.4, kind: 'wood', initialOpen: false },
  { id: 'reception_foyer', rooms: ['reception', 'foyer'], axis: 'x', at: -4, center: 4.5, width: 1.8, kind: 'arch' },
  { id: 'reception_day', rooms: ['reception', 'day'], axis: 'z', at: 1, center: -7, width: 1.3, kind: 'wood', initialOpen: false },
  { id: 'day_foyer', rooms: ['day', 'foyer'], axis: 'x', at: -4, center: -2.5, width: 1.3, kind: 'wood', initialOpen: false },
  { id: 'day_treatment', rooms: ['day', 'treatment'], axis: 'x', at: -10, center: -4, width: 1.3, kind: 'wood', initialOpen: true },
  { id: 'foyer_archive', rooms: ['foyer', 'archive'], axis: 'z', at: -3, center: 0, width: 2.6, kind: 'arch' },
  { id: 'foyer_corridor', rooms: ['foyer', 'corridor'], axis: 'x', at: 4, center: -1.2, width: 1.8, kind: 'arch' },
  { id: 'corridor_dining', rooms: ['corridor', 'dining'], axis: 'x', at: 7, center: 4.5, width: 1.3, kind: 'wood', initialOpen: false },
  { id: 'dining_kitchen', rooms: ['dining', 'kitchen'], axis: 'z', at: 1, center: 10.5, width: 1.3, kind: 'wood', initialOpen: false },
  { id: 'kitchen_corridor', rooms: ['corridor', 'kitchen'], axis: 'x', at: 7, center: -1, width: 1.3, kind: 'wood', initialOpen: true },
  { id: 'kitchen_records', rooms: ['kitchen', 'records'], axis: 'z', at: -3, center: 12, width: 1.3, kind: 'wood', initialOpen: true },
  { id: 'archive_office', rooms: ['archive', 'office'], axis: 'x', at: 4, center: -7.5, width: 1.3, kind: 'wood', initialOpen: false, locked: 'office' },
  { id: 'office_records', rooms: ['office', 'records'], axis: 'x', at: 10, center: -7.5, width: 1.3, kind: 'wood', initialOpen: true },
  { id: 'ward_hall', rooms: ['ward', 'balcony'], axis: 'x', at: 2.5, center: -7, width: 1.3, kind: 'wood', initialOpen: false },
  { id: 'observation_hall', rooms: ['observation', 'hall'], axis: 'x', at: 2.5, center: -16, width: 1.3, kind: 'wood', initialOpen: false },
  { id: 'quarters_hall', rooms: ['quarters', 'hall'], axis: 'x', at: 4, center: -16, width: 1.2, kind: 'wood', initialOpen: false },
  { id: 'hall_balcony', rooms: ['hall', 'balcony'], axis: 'z', at: -12, center: 3.25, width: 1.4, kind: 'arch', initialOpen: true },
  { id: 'ward_observation', rooms: ['ward', 'observation'], axis: 'z', at: -12, center: -6, width: 1.3, kind: 'wood', initialOpen: false },
  { id: 'landing_workshop', rooms: ['landing', 'workshop'], axis: 'x', at: -4, center: -4, width: 1.3, kind: 'metal', initialOpen: false },
  { id: 'landing_generator', rooms: ['landing', 'generator'], axis: 'x', at: 4, center: -4, width: 1.3, kind: 'metal', initialOpen: false },
  { id: 'landing_cellar', rooms: ['landing', 'cellar'], axis: 'z', at: -8, center: 0, width: 2.4, kind: 'arch' },
  { id: 'cellar_workshop', rooms: ['cellar', 'workshop'], axis: 'z', at: -8, center: -7, width: 1.3, kind: 'metal', initialOpen: true },
  { id: 'cellar_generator', rooms: ['cellar', 'generator'], axis: 'z', at: -8, center: 7, width: 1.3, kind: 'metal', initialOpen: true },
  { id: 'cellar_laundry', rooms: ['cellar', 'laundry'], axis: 'z', at: -14, center: -7, width: 1.2, kind: 'metal', initialOpen: true },
  { id: 'cellar_boiler', rooms: ['cellar', 'boiler'], axis: 'z', at: -14, center: 7, width: 1.2, kind: 'metal', initialOpen: true },
];

export const DOOR_BY_ID = Object.fromEntries(DOORS.map((door) => [door.id, door]));

export const PROPS = [
  // Intake
  { slug: 'old_bed_frame', floor: 'ground', x: -13.7, z: 2.3, rotY: 0, height: 0.95, collider: true, room: 'intake' },
  { slug: 'drawer_cabinet', floor: 'ground', x: -15.4, z: 6.8, rotY: Math.PI / 2, height: 1.05, collider: true, room: 'intake' },
  { slug: 'SchoolChair_01', floor: 'ground', x: -11.2, z: 6.7, rotY: Math.PI, height: 0.85, room: 'intake' },
  { slug: 'wall_clock', floor: 'ground', x: -15.82, z: 2.7, y: 2.25, anchor: 'center', rotY: Math.PI / 2, height: 0.45, room: 'intake' },

  // Reception
  { slug: 'metal_office_desk', floor: 'ground', x: -7.1, z: 4.3, rotY: 0, height: 0.8, collider: true, room: 'reception' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: -7.1, z: 3.0, rotY: Math.PI, height: 0.95, room: 'reception' },
  { slug: 'drawer_cabinet', floor: 'ground', x: -9.5, z: 2.3, rotY: Math.PI / 2, height: 1.05, collider: true, room: 'reception' },
  { slug: 'vintage_radio_transceiver', floor: 'ground', x: -8.9, z: 6.4, rotY: 0.4, height: 0.38, room: 'reception' },
  { slug: 'wall_clock', floor: 'ground', x: -9.82, z: 4.7, y: 2.2, anchor: 'center', rotY: Math.PI / 2, height: 0.45, room: 'reception' },
  { slug: 'metal_stool_01', floor: 'ground', x: -5.7, z: 6.7, rotY: 0, height: 0.55, room: 'reception' },

  // Foyer
  { slug: 'vintage_grandfather_clock_01', floor: 'ground', x: 3.35, z: 2.2, rotY: -Math.PI / 2, height: 2.3, collider: true, room: 'foyer' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: -3.2, z: 1.0, rotY: Math.PI / 2, height: 0.95, room: 'foyer' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: -3.2, z: -1.0, rotY: Math.PI / 2, height: 0.95, room: 'foyer' },
  { slug: 'SchoolDesk_01', floor: 'ground', x: 3.3, z: 4.3, rotY: -Math.PI / 2, height: 0.75, room: 'foyer' },

  // Day Room
  { slug: 'WoodenTable_01', floor: 'ground', x: -6.9, z: -4.2, rotY: 0, height: 0.8, collider: true, room: 'day' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: -8.3, z: -4.2, rotY: Math.PI / 2, height: 0.95, room: 'day' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: -5.5, z: -4.2, rotY: -Math.PI / 2, height: 0.95, room: 'day' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: -6.9, z: -5.4, rotY: 0, height: 0.95, room: 'day' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: -6.9, z: -3.0, rotY: Math.PI, height: 0.95, room: 'day' },
  { slug: 'vintage_cabinet_01', floor: 'ground', x: -9.4, z: -6.6, rotY: Math.PI / 2, height: 1.65, collider: true, room: 'day' },
  { slug: 'wheelchair_01', floor: 'ground', x: -5.0, z: 0.0, rotY: Math.PI / 2, height: 1.0, room: 'day' },
  { slug: 'wall_clock', floor: 'ground', x: -9.82, z: -3.0, y: 2.2, anchor: 'center', rotY: Math.PI / 2, height: 0.45, room: 'day' },

  // Treatment
  { slug: 'vintage_day_bed', floor: 'ground', x: -14.4, z: -6.4, rotY: Math.PI / 2, height: 0.72, collider: true, room: 'treatment' },
  { slug: 'metal_stool_01', floor: 'ground', x: -12.7, z: -2.4, rotY: 0, height: 0.55, room: 'treatment' },
  { slug: 'metal_stool_01', floor: 'ground', x: -11.6, z: -5.4, rotY: 0, height: 0.55, room: 'treatment' },
  { slug: 'medical_box', floor: 'ground', x: -15.3, z: -1.4, rotY: 0.2, height: 0.4, room: 'treatment' },

  // Archive
  { slug: 'wooden_bookshelf_worn', floor: 'ground', x: -3.6, z: -5.0, rotY: Math.PI / 2, height: 2.05, collider: true, room: 'archive' },
  { slug: 'wooden_bookshelf_worn', floor: 'ground', x: -3.6, z: -8.2, rotY: Math.PI / 2, height: 2.05, collider: true, room: 'archive' },
  { slug: 'wooden_bookshelf_worn', floor: 'ground', x: -3.6, z: -11.0, rotY: Math.PI / 2, height: 2.05, collider: true, room: 'archive' },
  { slug: 'drawer_cabinet', floor: 'ground', x: 3.5, z: -4.7, rotY: -Math.PI / 2, height: 1.05, collider: true, room: 'archive' },
  { slug: 'drawer_cabinet', floor: 'ground', x: 3.5, z: -10.8, rotY: -Math.PI / 2, height: 1.05, collider: true, room: 'archive' },
  { slug: 'metal_office_desk', floor: 'ground', x: 0.4, z: -9.0, rotY: 0, height: 0.8, collider: true, room: 'archive' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 0.4, z: -7.8, rotY: Math.PI, height: 0.85, room: 'archive' },

  // Office
  { slug: 'metal_office_desk', floor: 'ground', x: 6.8, z: -9.3, rotY: 0, height: 0.8, collider: true, room: 'office' },
  { slug: 'GothicCabinet_01', floor: 'ground', x: 9.45, z: -10.4, rotY: -Math.PI / 2, height: 2.1, collider: true, room: 'office' },
  { slug: 'painted_wooden_chair_01', floor: 'ground', x: 6.8, z: -10.6, rotY: Math.PI, height: 0.95, room: 'office' },
  { slug: 'desk_lamp_arm_01', floor: 'ground', x: 7.55, z: -9.15, y: 0.82, rotY: -0.4, height: 0.62, room: 'office' },
  { slug: 'vintage_radio_transceiver', floor: 'ground', x: 7.35, z: -8.98, y: 0.82, rotY: 0.2, height: 0.36, room: 'office' },
  { slug: 'ornate_mirror_01', floor: 'ground', x: 8.3, z: -11.82, y: 1.55, anchor: 'center', rotY: 0, height: 1.6, room: 'office' },

  // Records
  { slug: 'Shelf_01', floor: 'ground', x: 12.0, z: -11.8, rotY: 0, height: 1.85, collider: true, room: 'records' },
  { slug: 'Shelf_01', floor: 'ground', x: 14.0, z: -11.8, rotY: 0, height: 1.85, collider: true, room: 'records' },
  { slug: 'drawer_cabinet', floor: 'ground', x: 15.4, z: -6.0, rotY: -Math.PI / 2, height: 1.05, collider: true, room: 'records' },
  { slug: 'SchoolDesk_01', floor: 'ground', x: 12.4, z: -9.8, rotY: 0, height: 0.75, room: 'records' },
  { slug: 'wooden_bookshelf_worn', floor: 'ground', x: 10.5, z: -4.3, rotY: Math.PI, height: 2.0, collider: true, room: 'records' },

  // East corridor
  { slug: 'wheelchair_01', floor: 'ground', x: 6.3, z: -0.7, rotY: -Math.PI / 2, height: 1.0, room: 'corridor' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 5.3, z: 2.7, rotY: -Math.PI / 2, height: 0.85, room: 'corridor' },
  { slug: 'metal_stool_01', floor: 'ground', x: 6.5, z: 5.7, rotY: 0, height: 0.55, room: 'corridor' },
  { slug: 'wall_clock', floor: 'ground', x: 6.82, z: 3.0, y: 2.2, anchor: 'center', rotY: -Math.PI / 2, height: 0.45, room: 'corridor' },

  // Dining
  { slug: 'WoodenTable_01', floor: 'ground', x: 10.5, z: 4.5, rotY: 0, height: 0.8, collider: true, room: 'dining' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 9.2, z: 4.5, rotY: Math.PI / 2, height: 0.85, room: 'dining' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 11.8, z: 4.5, rotY: -Math.PI / 2, height: 0.85, room: 'dining' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 10.5, z: 3.0, rotY: 0, height: 0.85, room: 'dining' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 10.5, z: 6.0, rotY: Math.PI, height: 0.85, room: 'dining' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 9.2, z: 3.2, rotY: Math.PI / 4, height: 0.85, room: 'dining' },
  { slug: 'SchoolChair_01', floor: 'ground', x: 11.8, z: 5.8, rotY: -3 * Math.PI / 4, height: 0.85, room: 'dining' },
  { slug: 'vintage_cabinet_01', floor: 'ground', x: 13.4, z: 7.4, rotY: Math.PI, height: 1.65, collider: true, room: 'dining' },
  { slug: 'vintage_radio_transceiver', floor: 'ground', x: 13.5, z: 1.8, rotY: -0.3, height: 0.38, room: 'dining' },
  { slug: 'hanging_industrial_lamp', floor: 'ground', x: 10.5, z: 4.5, y: 2.75, anchor: 'center', rotY: 0, height: 0.65, room: 'dining' },

  // Kitchen
  { slug: 'vintage_cabinet_01', floor: 'ground', x: 13.5, z: -1.0, rotY: -Math.PI / 2, height: 1.65, collider: true, room: 'kitchen' },
  { slug: 'vintage_cabinet_01', floor: 'ground', x: 8.1, z: 0.3, rotY: Math.PI / 2, height: 1.65, collider: true, room: 'kitchen' },
  { slug: 'Shelf_01', floor: 'ground', x: 13.85, z: 0.35, rotY: -Math.PI / 2, height: 1.75, collider: true, room: 'kitchen' },
  { slug: 'metal_stool_01', floor: 'ground', x: 9.1, z: -2.4, rotY: 0, height: 0.55, room: 'kitchen' },
  { slug: 'medical_box', floor: 'ground', x: 8.2, z: -2.4, rotY: 0.3, height: 0.38, room: 'kitchen' },
  { slug: 'vintage_radio_transceiver', floor: 'ground', x: 13.45, z: -0.85, y: 1.65, rotY: -Math.PI / 2, height: 0.36, room: 'kitchen' },

  // Ward
  { slug: 'old_bed_frame', floor: 'upper', x: -8.4, z: -9.6, rotY: 0, height: 0.95, collider: true, room: 'ward' },
  { slug: 'old_bed_frame', floor: 'upper', x: -5.2, z: -9.6, rotY: 0, height: 0.95, collider: true, room: 'ward' },
  { slug: 'old_bed_frame', floor: 'upper', x: -2.0, z: -9.6, rotY: 0, height: 0.95, collider: true, room: 'ward' },
  { slug: 'old_bed_frame', floor: 'upper', x: 1.2, z: -9.6, rotY: 0, height: 0.95, collider: true, room: 'ward' },
  { slug: 'drawer_cabinet', floor: 'upper', x: -9.5, z: -4.0, rotY: Math.PI / 2, height: 1.05, collider: true, room: 'ward' },
  { slug: 'drawer_cabinet', floor: 'upper', x: 0.0, z: -11.5, rotY: 0, height: 1.05, collider: true, room: 'ward' },
  { slug: 'SchoolChair_01', floor: 'upper', x: 1.0, z: -4.3, rotY: Math.PI, height: 0.85, room: 'ward' },
  { slug: 'metal_stool_01', floor: 'upper', x: -4.0, z: -4.2, rotY: 0, height: 0.55, room: 'ward' },

  // Observation
  { slug: 'metal_office_desk', floor: 'upper', x: -4.0, z: -18.3, rotY: 0, height: 0.8, collider: true, room: 'observation' },
  { slug: 'desk_lamp_arm_01', floor: 'upper', x: -3.55, z: -18.45, y: 3.4 + 0.82, rotY: 0.5, height: 0.62, room: 'observation' },
  { slug: 'SchoolChair_01', floor: 'upper', x: -4.0, z: -17.1, rotY: Math.PI, height: 0.85, room: 'observation' },
  { slug: 'Shelf_01', floor: 'upper', x: -9.4, z: -18.6, rotY: 0, height: 1.75, collider: true, room: 'observation' },
  { slug: 'wall_clock', floor: 'upper', x: -9.82, z: -15.0, y: 3.4 + 2.2, anchor: 'center', rotY: Math.PI / 2, height: 0.45, room: 'observation' },

  // Quarters
  { slug: 'vintage_day_bed', floor: 'upper', x: 6.6, z: -16.3, rotY: 0, height: 0.72, collider: true, room: 'quarters' },
  { slug: 'drawer_cabinet', floor: 'upper', x: 4.6, z: -18.4, rotY: 0, height: 1.05, collider: true, room: 'quarters' },
  { slug: 'painted_wooden_chair_01', floor: 'upper', x: 8.8, z: -14.2, rotY: -Math.PI / 2, height: 0.95, room: 'quarters' },

  // Basement landing
  { slug: 'industrial_caged_sconce', floor: 'basement', x: -3.88, z: -2.0, y: 2.2, anchor: 'center', rotY: Math.PI / 2, height: 0.5, room: 'landing' },
  { slug: 'industrial_caged_sconce', floor: 'basement', x: 3.88, z: -6.0, y: 2.2, anchor: 'center', rotY: -Math.PI / 2, height: 0.5, room: 'landing' },

  // Workshop
  { slug: 'WoodenTable_01', floor: 'basement', x: -7.0, z: -4.4, rotY: 0, height: 0.8, collider: true, room: 'workshop' },
  { slug: 'Shelf_01', floor: 'basement', x: -9.5, z: -6.5, rotY: Math.PI / 2, height: 1.8, collider: true, room: 'workshop' },
  { slug: 'medical_box', floor: 'basement', x: -8.0, z: -4.0, y: 0.82, rotY: 0.2, height: 0.35, room: 'workshop' },
  { slug: 'metal_stool_01', floor: 'basement', x: -5.2, z: -2.0, rotY: 0, height: 0.55, room: 'workshop' },

  // Generator room
  { slug: 'portable_generator', floor: 'basement', x: 6.8, z: -6.2, rotY: -Math.PI / 2, height: 1.15, collider: true, room: 'generator' },
  { slug: 'vintage_radio_transceiver', floor: 'basement', x: 8.8, z: -2.2, rotY: -0.2, height: 0.38, room: 'generator' },
  { slug: 'medical_box', floor: 'basement', x: 5.4, z: -2.2, rotY: 0.2, height: 0.38, room: 'generator' },
  { slug: 'metal_stool_01', floor: 'basement', x: 8.5, z: -5.0, rotY: 0, height: 0.55, room: 'generator' },

  // Cellar
  { slug: 'hanging_industrial_lamp', floor: 'basement', x: -6.0, z: -11.0, y: -1.2, anchor: 'center', rotY: 0, height: 0.65, room: 'cellar' },
  { slug: 'hanging_industrial_lamp', floor: 'basement', x: 0.0, z: -11.0, y: -1.2, anchor: 'center', rotY: 0, height: 0.65, room: 'cellar' },
  { slug: 'hanging_industrial_lamp', floor: 'basement', x: 6.0, z: -11.0, y: -1.2, anchor: 'center', rotY: 0, height: 0.65, room: 'cellar' },
  { slug: 'Shelf_01', floor: 'basement', x: -9.5, z: -12.8, rotY: Math.PI / 2, height: 1.75, collider: true, room: 'cellar' },

  // Laundry
  { slug: 'WoodenTable_01', floor: 'basement', x: -7.0, z: -16.8, rotY: 0, height: 0.78, collider: true, room: 'laundry' },
  { slug: 'vintage_cabinet_01', floor: 'basement', x: -9.5, z: -19.4, rotY: 0, height: 1.65, collider: true, room: 'laundry' },
  { slug: 'medical_box', floor: 'basement', x: -5.2, z: -19.2, rotY: 0.4, height: 0.4, room: 'laundry' },

  // Boiler
  { slug: 'Shelf_01', floor: 'basement', x: 9.5, z: -18.6, rotY: -Math.PI / 2, height: 1.75, collider: true, room: 'boiler' },
  { slug: 'metal_stool_01', floor: 'basement', x: 6.0, z: -16.0, rotY: 0, height: 0.55, room: 'boiler' },
  { slug: 'medical_box', floor: 'basement', x: 8.8, z: -15.2, rotY: -0.2, height: 0.4, room: 'boiler' },
];

export const HIDE_SPOTS = [
  { id: 'hide_cot', floor: 'ground', x: -13.7, z: 2.3, eyeY: 0.58, yaw: Math.PI / 2, label: 'Under the cot', room: 'intake' },
  { id: 'hide_desk', floor: 'ground', x: -7.1, z: 3.5, eyeY: 0.95, yaw: Math.PI, label: 'Behind the reception desk', room: 'reception' },
  { id: 'hide_curtain', floor: 'ground', x: -9.52, z: -1.4, eyeY: 1.35, yaw: -Math.PI / 2, label: 'Behind the day-room curtains', room: 'day' },
  { id: 'hide_files', floor: 'ground', x: 3.2, z: -10.4, eyeY: 1.25, yaw: Math.PI / 2, label: 'Behind the filing cabinets', room: 'archive' },
  { id: 'hide_linen', floor: 'ground', x: 6.42, z: -2.4, eyeY: 1.4, yaw: Math.PI / 2, label: 'Inside the linen closet', room: 'corridor' },
  { id: 'hide_table', floor: 'ground', x: 10.5, z: 4.5, eyeY: 0.42, yaw: Math.PI, pitchUp: 0.5, pitchDown: 0.9, label: 'Under the dining table', room: 'dining' },
  { id: 'hide_pantry', floor: 'ground', x: 13.3, z: -2.05, eyeY: 1.32, yaw: Math.PI / 2, label: 'Inside the pantry', room: 'kitchen' },
  { id: 'hide_wardrobe', floor: 'ground', x: 9.5, z: -4.6, eyeY: 1.3, yaw: Math.PI / 2, label: 'Inside the tall cabinet', room: 'office' },
  { id: 'hide_bed', floor: 'upper', x: -8.4, z: -9.6, eyeY: 0.4, yaw: Math.PI, pitchUp: 0.46, pitchDown: 0.9, label: 'Under the ward bed', room: 'ward' },
  { id: 'hide_bench', floor: 'basement', x: -7.0, z: -4.4, eyeY: 0.42, yaw: 0, pitchUp: 0.5, pitchDown: 0.9, label: 'Under the workbench', room: 'workshop' },
  { id: 'hide_laundry', floor: 'basement', x: -7.0, z: -16.8, eyeY: 0.42, yaw: 0, pitchUp: 0.5, pitchDown: 0.9, label: 'Under the folding table', room: 'laundry' },
];

export const CANDLES = [
  { id: 'candle_reception', floor: 'ground', x: -9.5, z: 2.3, y: 1.05, room: 'reception', label: 'Reception candle', checkpoint: { x: -8.7, z: 2.9, yaw: -1.2 } },
  { id: 'candle_ward', floor: 'upper', x: 0.0, z: -11.5, y: 3.4 + 1.05, room: 'ward', label: 'Ward candle', checkpoint: { x: 0.7, z: -10.7, yaw: -0.4 } },
  { id: 'candle_office', floor: 'ground', x: 6.35, z: -9.15, y: 0.8, room: 'office', label: 'Office candle', checkpoint: { x: 7.0, z: -8.5, yaw: 2.4 } },
  { id: 'candle_workshop', floor: 'basement', x: -6.0, z: -4.5, y: -3.6 + 0.8, room: 'workshop', label: 'Workshop candle', checkpoint: { x: -6.2, z: -5.3, yaw: 0.8 } },
  { id: 'candle_quarters', floor: 'upper', x: 4.6, z: -18.4, y: 3.4 + 1.05, room: 'quarters', label: 'Nursery candle', checkpoint: { x: 5.3, z: -17.7, yaw: 2.2 } },
];

export const SIGNS = [
  { floor: 'ground', text: 'GRAND FOYER', x: 0, z: 7.86, y: 2.75, rotY: 0, w: 2.2, h: 0.34 },
  { floor: 'ground', text: 'ARCHIVE', x: 0, z: -3.08, y: 2.6, rotY: Math.PI, w: 1.6, h: 0.3 },
  { floor: 'ground', text: 'DAY ROOM', x: -3.92, z: -2.5, y: 2.55, rotY: Math.PI / 2, w: 1.6, h: 0.3 },
  { floor: 'ground', text: 'EAST CORRIDOR', x: 3.92, z: 1.5, y: 2.55, rotY: -Math.PI / 2, w: 1.8, h: 0.3 },
  { floor: 'ground', text: 'RECEPTION', x: -10.08, z: 4.5, y: 2.55, rotY: Math.PI / 2, w: 1.5, h: 0.3 },
  { floor: 'ground', text: 'INTAKE', x: -10.08, z: 4.5, y: 2.15, rotY: Math.PI / 2, w: 1.3, h: 0.28 },
  { floor: 'ground', text: 'WARD', x: 2.58, z: -7, y: 2.75, rotY: -Math.PI / 2, w: 1.3, h: 0.28 },
  { floor: 'upper', text: 'OBSERVATION', x: 2.58, z: -16, y: 3.4 + 2.6, rotY: -Math.PI / 2, w: 1.6, h: 0.28 },
  { floor: 'upper', text: 'PATIENT WARD', x: 2.58, z: -7, y: 3.4 + 2.6, rotY: -Math.PI / 2, w: 1.7, h: 0.28 },
  { floor: 'basement', text: 'GENERATOR', x: 3.92, z: -4, y: 2.5, rotY: -Math.PI / 2, w: 1.6, h: 0.3 },
  { floor: 'basement', text: 'WORKSHOP', x: -3.92, z: -4, y: 2.5, rotY: Math.PI / 2, w: 1.6, h: 0.3 },
  { floor: 'ground', text: 'EXIT', x: 0, z: 7.9, y: 3.7, rotY: 0, w: 0.7, h: 0.3, exit: true },
];

export const NAV_NODES = [
  { id: 'intake', pos: [-14.0, 0, 4.5], floor: 'ground', room: 'intake' },
  { id: 'intake_door', pos: [-9.2, 0, 4.5], floor: 'ground', room: 'intake' },
  { id: 'reception', pos: [-7.0, 0, 4.5], floor: 'ground', room: 'reception' },
  { id: 'reception_back', pos: [-7.0, 0, 1.8], floor: 'ground', room: 'reception' },
  { id: 'foyer_w', pos: [-3.0, 0, 4.5], floor: 'ground', room: 'foyer' },
  { id: 'day', pos: [-7.0, 0, -3.0], floor: 'ground', room: 'day' },
  { id: 'treatment', pos: [-12.0, 0, -4.0], floor: 'ground', room: 'treatment' },
  { id: 'foyer_c', pos: [0, 0, 2.0], floor: 'ground', room: 'foyer' },
  { id: 'foyer_n', pos: [0, 0, -2.2], floor: 'ground', room: 'foyer' },
  { id: 'archive', pos: [0, 0, -6.5], floor: 'ground', room: 'archive' },
  { id: 'archive_e', pos: [3.0, 0, -7.5], floor: 'ground', room: 'archive' },
  { id: 'office', pos: [5.7, 0, -7.5], floor: 'ground', room: 'office' },
  { id: 'office_n', pos: [7.0, 0, -10.0], floor: 'ground', room: 'office' },
  { id: 'records_w', pos: [10.8, 0, -7.5], floor: 'ground', room: 'records' },
  { id: 'records', pos: [12.5, 0, -7.5], floor: 'ground', room: 'records' },
  { id: 'foyer_e', pos: [3.2, 0, 1.5], floor: 'ground', room: 'foyer' },
  { id: 'corridor', pos: [5.5, 0, 1.5], floor: 'ground', room: 'corridor' },
  { id: 'corridor_dining', pos: [6.2, 0, 4.5], floor: 'ground', room: 'corridor' },
  { id: 'dining', pos: [8.4, 0, 4.5], floor: 'ground', room: 'dining' },
  { id: 'dining_kitchen', pos: [10.5, 0, 0.4], floor: 'ground', room: 'dining' },
  { id: 'kitchen', pos: [10.5, 0, -1.0], floor: 'ground', room: 'kitchen' },
  { id: 'kitchen_corridor', pos: [7.8, 0, -1.0], floor: 'ground', room: 'kitchen' },
  { id: 'kitchen_records', pos: [12.0, 0, -2.2], floor: 'ground', room: 'kitchen' },
  { id: 'records_n', pos: [12.0, 0, -3.8], floor: 'ground', room: 'records' },
  { id: 'stair_bottom', pos: [3.15, 0, 6.2], floor: 'ground', room: 'foyer' },
  { id: 'stair_mid', pos: [3.15, 1.7, 3.85], floor: 'ground', room: 'foyer', ramp: true },
  { id: 'stair_top', pos: [3.15, 3.4, 1.65], floor: 'upper', room: 'balcony' },
  { id: 'balcony_s', pos: [3.2, 3.4, 0.0], floor: 'upper', room: 'balcony' },
  { id: 'balcony_n', pos: [3.2, 3.4, -2.6], floor: 'upper', room: 'balcony' },
  { id: 'hall_ward', pos: [3.2, 3.4, -7.0], floor: 'upper', room: 'balcony' },
  { id: 'ward', pos: [-1.5, 3.4, -7.0], floor: 'upper', room: 'ward' },
  { id: 'hall_obs', pos: [3.2, 3.4, -16.0], floor: 'upper', room: 'hall' },
  { id: 'observation', pos: [-1.5, 3.4, -16.0], floor: 'upper', room: 'observation' },
  { id: 'hall_q', pos: [4.8, 3.4, -16.0], floor: 'upper', room: 'quarters' },
  { id: 'quarters', pos: [6.5, 3.4, -16.0], floor: 'upper', room: 'quarters' },
  { id: 'ward_obs', pos: [-6.0, 3.4, -12.8], floor: 'upper', room: 'ward' },
  { id: 'landing', pos: [0, -3.6, -3.0], floor: 'basement', room: 'landing' },
  { id: 'landing_w', pos: [-3.0, -3.6, -4.0], floor: 'basement', room: 'landing' },
  { id: 'landing_e', pos: [3.0, -3.6, -4.0], floor: 'basement', room: 'landing' },
  { id: 'workshop', pos: [-6.5, -3.6, -4.0], floor: 'basement', room: 'workshop' },
  { id: 'generator', pos: [7.0, -3.6, -4.0], floor: 'basement', room: 'generator' },
  { id: 'cellar_n', pos: [0, -3.6, -9.0], floor: 'basement', room: 'cellar' },
  { id: 'cellar_w', pos: [-6.0, -3.6, -11.0], floor: 'basement', room: 'cellar' },
  { id: 'cellar_e', pos: [6.0, -3.6, -11.0], floor: 'basement', room: 'cellar' },
  { id: 'cellar_sw', pos: [-7.0, -3.6, -13.0], floor: 'basement', room: 'cellar' },
  { id: 'cellar_se', pos: [7.0, -3.6, -13.0], floor: 'basement', room: 'cellar' },
  { id: 'laundry', pos: [-7.0, -3.6, -16.0], floor: 'basement', room: 'laundry' },
  { id: 'boiler', pos: [7.0, -3.6, -16.0], floor: 'basement', room: 'boiler' },
];

export const NAV_BY_ID = Object.fromEntries(NAV_NODES.map((node) => [node.id, node]));

export const NAV_EDGES = [
  ['intake', 'intake_door', 'intake_reception'],
  ['intake_door', 'reception', 'intake_reception'],
  ['reception', 'reception_back', 'reception_day'],
  ['reception_back', 'day', 'reception_day'],
  ['reception', 'foyer_w', 'reception_foyer'],
  ['foyer_w', 'foyer_c'],
  ['foyer_w', 'day', 'day_foyer'],
  ['day', 'treatment', 'day_treatment'],
  ['foyer_c', 'foyer_n'],
  ['foyer_n', 'archive', 'foyer_archive'],
  ['archive', 'archive_e'],
  ['archive_e', 'office', 'archive_office'],
  ['office', 'office_n'],
  ['office_n', 'records_w', 'office_records'],
  ['records_w', 'records'],
  ['foyer_c', 'foyer_e', 'foyer_corridor'],
  ['foyer_e', 'corridor'],
  ['corridor', 'corridor_dining'],
  ['corridor_dining', 'dining', 'corridor_dining'],
  ['dining', 'dining_kitchen'],
  ['dining_kitchen', 'kitchen', 'dining_kitchen'],
  ['kitchen', 'kitchen_corridor', 'kitchen_corridor'],
  ['kitchen_corridor', 'corridor', 'kitchen_corridor'],
  ['kitchen', 'kitchen_records'],
  ['kitchen_records', 'records_n', 'kitchen_records'],
  ['records_n', 'records'],
  ['foyer_c', 'stair_bottom'],
  ['stair_bottom', 'stair_mid'],
  ['stair_mid', 'stair_top'],
  ['stair_top', 'balcony_s'],
  ['balcony_s', 'balcony_n'],
  ['balcony_n', 'hall_ward'],
  ['hall_ward', 'ward', 'ward_hall'],
  ['balcony_n', 'hall_obs', 'hall_balcony'],
  ['hall_obs', 'observation', 'observation_hall'],
  ['hall_obs', 'hall_q'],
  ['hall_q', 'quarters', 'quarters_hall'],
  ['ward', 'ward_obs'],
  ['ward_obs', 'observation', 'ward_observation'],
  ['landing', 'landing_w'],
  ['landing_w', 'workshop', 'landing_workshop'],
  ['landing', 'landing_e'],
  ['landing_e', 'generator', 'landing_generator'],
  ['landing', 'cellar_n'],
  ['cellar_n', 'cellar_w'],
  ['cellar_n', 'cellar_e'],
  ['cellar_w', 'workshop', 'cellar_workshop'],
  ['cellar_e', 'generator', 'cellar_generator'],
  ['cellar_w', 'cellar_sw'],
  ['cellar_e', 'cellar_se'],
  ['cellar_sw', 'laundry', 'cellar_laundry'],
  ['cellar_se', 'boiler', 'cellar_boiler'],
].map(([a, b, door]) => ({ a, b, door }));

export const PATROL_GROUND = ['foyer_c', 'foyer_w', 'reception', 'reception_back', 'day', 'foyer_w', 'foyer_c', 'corridor', 'dining', 'dining_kitchen', 'kitchen', 'kitchen_corridor', 'corridor', 'foyer_e', 'foyer_c'];
export const PATROL_UPPER = ['stair_top', 'balcony_s', 'balcony_n', 'ward', 'hall_ward', 'hall_obs', 'observation', 'hall_q', 'quarters', 'hall_obs', 'hall_ward', 'balcony_n', 'stair_top'];
export const PATROL_FULL = ['foyer_c', 'foyer_w', 'day', 'foyer_w', 'foyer_c', 'archive', 'foyer_n', 'foyer_c', 'stair_bottom', 'stair_mid', 'stair_top', 'balcony_s', 'balcony_n', 'hall_ward', 'ward', 'hall_ward', 'hall_obs', 'observation', 'hall_obs', 'balcony_n', 'balcony_s', 'stair_top', 'stair_mid', 'stair_bottom', 'foyer_c'];

export const SLEEPWALKER_ROUTES = [
  ['workshop', 'landing_w', 'landing', 'cellar_n', 'cellar_w', 'cellar_sw', 'laundry', 'cellar_sw', 'cellar_w', 'workshop'],
  ['generator', 'landing_e', 'landing', 'cellar_n', 'cellar_e', 'cellar_se', 'boiler', 'cellar_se', 'cellar_e', 'generator'],
  ['cellar_n', 'cellar_w', 'cellar_sw', 'cellar_n', 'cellar_e', 'cellar_se', 'cellar_n'],
];

export const ROOM_LIGHTS = [
  { id: 'foyer_chand', floor: 'ground', x: 0, y: 4.8, z: 2.0, color: 0xffc98b, intensity: 0.9, distance: 13 },
  { id: 'reception_lamp', floor: 'ground', x: -7.2, y: 2.45, z: 5.8, color: 0xffc184, intensity: 0.65, distance: 7 },
  { id: 'day_fire', floor: 'ground', x: -9.4, y: 0.65, z: -3.4, color: 0xff8a46, intensity: 0.9, distance: 5.5 },
  { id: 'corridor_sconce', floor: 'ground', x: 6.6, y: 2.5, z: 3.0, color: 0xffbd7a, intensity: 0.5, distance: 6 },
  { id: 'dining_lamp', floor: 'ground', x: 10.5, y: 2.9, z: 4.5, color: 0xffc184, intensity: 0.55, distance: 6 },
  { id: 'ward_lamp', floor: 'upper', x: 1.6, y: 3.4 + 2.4, z: -4.0, color: 0xffd2a1, intensity: 0.7, distance: 7 },
  { id: 'observation_lamp', floor: 'upper', x: -4.0, y: 3.4 + 2.35, z: -18.3, color: 0xffc184, intensity: 0.45, distance: 5 },
  { id: 'workshop_lamp', floor: 'basement', x: -7.0, y: -1.2, z: -4.4, color: 0xffb36b, intensity: 0.55, distance: 6 },
  { id: 'generator_lamp', floor: 'basement', x: 7.0, y: -1.2, z: -4.0, color: 0xffb36b, intensity: 0.55, distance: 6 },
  { id: 'cellar_bulb', floor: 'basement', x: 0, y: -1.2, z: -11.0, color: 0xffc184, intensity: 0.5, distance: 7 },
  { id: 'attic_moon', floor: 'attic', x: -1.0, y: 9.1, z: -15.5, color: 0x9db7c8, intensity: 0.8, distance: 7 },
];
