export const PATIENTS = [
  {
    id: 'red',
    color: '#a84139',
    colorName: 'Red',
    name: 'Elsie Wren',
    age: 8,
    stage: 'REM',
    sleep: 'Rapid eye movement. She dreams with her eyes open.',
    comfort: 'A',
    comfortText: 'A — a lullaby, played twice.',
    note: 'Bed 1. Elsie asks for the same song every night. She says the lady with the bell already knows it.',
  },
  {
    id: 'blue',
    color: '#3d5e8c',
    colorName: 'Blue',
    name: 'Jonah Pike',
    age: 12,
    stage: 'II',
    sleep: 'Light sleep. He counts the ceiling tiles until he forgets the number.',
    comfort: 'G',
    comfortText: 'G — a glass of warm milk, no sugar.',
    note: 'Bed 2. Jonah has bitten through four pencil ends. He is afraid of the room behind the mirror.',
  },
  {
    id: 'yellow',
    color: '#c5a04a',
    colorName: 'Yellow',
    name: 'Ada Rook',
    age: 10,
    stage: 'I',
    sleep: 'Drowsing. She insists she has not slept at all.',
    comfort: 'C',
    comfortText: 'C — the curtain left open, one finger wide.',
    note: 'Bed 3. Ada drew the Matron with a bell where her mouth should be. She would not say why.',
  },
  {
    id: 'green',
    color: '#5c755b',
    colorName: 'Green',
    name: 'Tobias Finch',
    age: 11,
    stage: 'III',
    sleep: 'Deep sleep. His breathing keeps time with the boiler.',
    comfort: 'E',
    comfortText: 'E — a cold cloth on the back of the neck.',
    note: 'Bed 4. Tobias stopped speaking on the ninth night. He still hums the waking chord in his sleep.',
  },
];

export const NOTES = {
  admission_form: {
    title: 'ADMISSION — HUSHWOOD INSTITUTE',
    kicker: 'Intake / 17 October 1961',
    body: `
      <p><strong>PATIENT:</strong> MARA VALE, 9 years. Insomnia, night terrors, "hears music that is not playing".</p>
      <p>Referred by Dr. E. Vale. Course of treatment: the Quiet Cure. Voluntary. Parental consent signed.</p>
      <p class="faint">The child's handwriting fills the margin:</p>
      <p class="hand"><em>I am not asleep. I am only very quiet.</em></p>
      <p class="faint">Below, in a different hand:</p>
      <p class="hand"><em>She woke. No one else did.</em></p>
    `,
    clue: 'An old admission form. You were once a patient here.',
  },
  staff_memo: {
    title: 'NIGHT STAFF — MEMORANDUM',
    kicker: 'From the desk of the Matron',
    body: `
      <p>After lights out, no bells. Not the hand bell. Not the service bell. Not the little brass bell on the ward door.</p>
      <p>The children have begun to answer them.</p>
      <p class="faint">Pinned beneath:</p>
      <p class="hand"><em>Maintenance order 44 — the crowbar is kept by the day-room hearth. Do not let the night staff into the basement without it.</em></p>
    `,
    clue: 'A staff memo: no bells after lights out. The crowbar is by the day-room hearth.',
  },
  patient_drawing: {
    title: 'A CHILD’S DRAWING',
    kicker: 'Crayon on institutional paper',
    body: `
      <div class="drawing-note">THE LADY WITH THE BELL HAS NO EYES.<br>SHE SEES WITH HER EARS.<br>DON’T LET HER HEAR YOU WAKE.</div>
      <p class="faint">The figure is very tall. Her apron is drawn in white crayon, pressed so hard the paper has torn.</p>
    `,
    clue: 'The Matron cannot see. She hunts by sound.',
  },
  maintenance_plate: {
    title: 'GENERATOR SERVICE PLATE',
    kicker: 'Basement / Bell circuit',
    body: `
      <p><strong>SERVICE ORDER:</strong></p>
      <p class="order">THEATRE<br>WARD<br>BELL</p>
      <p>Prime fuel to the green band before throwing breakers. Overpressure vents to atmosphere. Do not start the house with the observation console live.</p>
      <p class="faint">Someone has scratched the last line out and written: <em>she hears the start.</em></p>
    `,
    clue: 'Breaker order: THEATRE → WARD → BELL. Prime into the green band.',
  },
  chalkboard: {
    title: 'THE WAKING CHORD',
    kicker: 'Observation room / protocol',
    body: `
      <p>The bell loft responds only to the chord. Youngest first. Each note struck twice.</p>
      <p class="order">A · A · C · C · E · E · G · G</p>
      <p>Do not play the chord until the house is awake. Do not play it to comfort them. The bell does not know the difference between waking and calling.</p>
      <p class="faint">Below, in chalk, much smaller: <em>Elsie — 8. Jonah — 12. Ada — 10. Tobias — 11.</em></p>
    `,
    clue: 'The Waking Chord: A A C C E E G G, youngest to eldest, each note twice.',
  },
  mirror_warning: {
    title: 'THE COVERED MIRROR',
    kicker: 'Matron’s office',
    body: `
      <p>Do not uncover the tall mirror. The safe remembers the moon, but the mirror remembers her.</p>
      <p>The four brass leaves turn a quarter at a time. Guide the moon into the moth. If the beam touches the glass, close your eyes.</p>
      <p class="faint">A photograph is tucked behind the note. A young woman in a nurse’s cap stands in a sunlit ward, laughing. On the back: <em>Agnes, before the Quiet Cure. Before she could not bear to hear them cry.</em></p>
    `,
    clue: 'The office safe needs moonlight routed through four mirrors into the moth sigil.',
  },
  safe_confession: {
    title: 'CONFESSION — SISTER AGNES HOLLOW',
    kicker: 'Found inside the wall safe',
    body: `
      <p>I sewed my eyes shut so I would stop looking for the children who did not wake. It did not help. I can hear every one of them. I can hear the house settle. I can hear the moths walking on the inside of the walls.</p>
      <p>Dr. Vale said the Quiet Cure would give them back their sleep. Instead it gave them a door, and something on the other side learned to breathe like them.</p>
      <p>If you are reading this, you are awake. Good. Stay that way. Take the Waking Key. Ring the bell once, properly, and go. Do not come back for me. I am the last thing keeping the door shut.</p>
      <p class="faint">Signed, in a careful hand: <em>Agnes.</em></p>
    `,
    clue: 'The Matron was once Sister Agnes Hollow. The bell opens the front door.',
  },
  office_photo: {
    title: 'A PHOTOGRAPH, FACING DOWN',
    kicker: 'Matron’s office',
    body: `
      <p>Six children in a row on the day-room rug. Five of them are blurred — moving, laughing, alive. The sixth is a girl with dark hair, staring straight into the lens.</p>
      <p>On the back: <em>Mara, after the first night. She asked to go home. I told her the cure was working.</em></p>
      <p class="faint">The frame is warm. Someone has been holding it.</p>
    `,
    clue: 'You were patient sixteen. The Matron remembers you.',
  },
  reel_1: {
    title: 'REEL 1 — DAY ROOM SESSION',
    kicker: 'Audio transcript / 11 October 1961',
    body: `
      <p><em>[A piano plays the same eight notes, over and over. A child laughs.]</em></p>
      <p><strong>DR. VALE:</strong> Again, Elsie. Younger first. Each note twice.</p>
      <p><strong>ELSIE:</strong> But she comes when I play it.</p>
      <p><strong>DR. VALE:</strong> Then we will teach her to sleep.</p>
      <p class="faint">The reel ends. Someone on the tape keeps breathing after the machine stops.</p>
    `,
    clue: 'The chord was taught to the children before the trial began.',
  },
  reel_2: {
    title: 'REEL 2 — HYDROTHERAPY',
    kicker: 'Audio transcript / 18 October 1961',
    body: `
      <p><em>[Water. A thin, steady hum. The sound of a door being held shut.]</em></p>
      <p><strong>MATRON:</strong> She is not to be submerged. The cold brings the other one up.</p>
      <p><strong>DR. VALE:</strong> There is no other one, Agnes.</p>
      <p><strong>MATRON:</strong> Then why does the water breathe?</p>
      <p class="faint">The tape hisses for a long time. Beneath the hiss: a lullaby, played on a music box with one broken tooth.</p>
    `,
    clue: 'The Quiet Cure opened something beneath the clinic. The Matron was trying to keep it shut.',
  },
  reel_3: {
    title: 'REEL 3 — THE LAST ROUND',
    kicker: 'Audio transcript / 3:17 AM',
    body: `
      <p><strong>MATRON:</strong> Sixteen is awake. The others are still under. The front door has sealed itself again.</p>
      <p><strong>DR. VALE:</strong> Let her go, Agnes. She is only a child.</p>
      <p><strong>MATRON:</strong> I am not keeping her in. I am keeping the rest of them asleep. If she rings the bell, they will all wake at once.</p>
      <p><em>[A small brass bell. One ring. The tape stops.]</em></p>
      <p class="faint">On the label, in pencil: <em>Mara — run.</em></p>
    `,
    clue: 'Ringing the bell will wake the children — and release what sleeps with them.',
  },
  front_door_note: {
    title: 'THE FRONT DOOR',
    kicker: 'Grand foyer / 3:17 AM',
    body: `
      <p>The maglock is dead. A brass plate beneath the handle reads:</p>
      <p class="order">THE HOUSE WILL NOT OPEN<br>UNTIL THE BELL HAS SPOKEN.</p>
      <p>The clock above the stairs has stopped at 3:17. It has been 3:17 for a very long time.</p>
    `,
    clue: 'The front door is held by the bell circuit. Restore power, then ring the Waking Bell.',
  },
  workshop_note: {
    title: 'WORKSHOP — FUSE CABINET',
    kicker: 'Basement / nails still warm',
    body: `
      <p>Cabinet nailed shut after the last outage. Spare ceramic fuse inside. Do not use the iron fuse. It sings.</p>
      <p class="faint">A second note, in a child's hand:</p>
      <p class="hand"><em>The basement children don't like the light. If you see them, put it out.</em></p>
    `,
    clue: 'The fuse cabinet is nailed shut. Pry it with the crowbar. Basement sleepwalkers follow light.',
  },
  generator_note: {
    title: 'GENERATOR — PRIME LINE',
    kicker: 'Handwritten on the fuel tank',
    body: `
      <p>Hold the prime lever. Watch the needle. Let go in the green band. Too little and she coughs. Too much and she spits.</p>
      <p>The breakers are labelled. The service order is on the plate by the door.</p>
    `,
    clue: 'Hold to prime. Release at 55–70 PSI. Breakers: THEATRE, WARD, BELL.',
  },
  ward_music_box: {
    title: 'ELSIE’S MUSIC BOX',
    kicker: 'Ward / Bed 1',
    body: `
      <p>The box is enamel, white, shaped like a moth. The key turns freely. The tune is the Waking Chord, but one note is missing.</p>
      <p>Elsie's chart says she asked for it to be played twice. The card inside the lid says: <em>Do not play after the lights go out.</em></p>
    `,
    clue: 'Elsie’s music box plays the chord with one note missing.',
  },
};

export const ENDINGS = {
  base: {
    title: 'THE QUIET CURE',
    body: `
      <p>You step through the front door into a rain that has been falling since 1961.</p>
      <p>Behind you, the bell keeps ringing. One by one, the ward lights come on. You do not turn around to count the small shapes at the windows.</p>
      <p>The letter in your pocket is blank. It has always been blank.</p>
      <p class="epilogue">Mara Vale left Hushwood at 3:18 AM. The clinic was not there the next morning.</p>
    `,
  },
  reels: {
    title: 'THE LAST ROUND',
    body: `
      <p>You step through the front door into rain that smells of iodine and old paper.</p>
      <p>You have heard the reels. You know what the bell is waking. Behind you, the ward lights come on one by one — and this time you do turn.</p>
      <p>At the top window stands the Matron. Her blindfold is off. She is not looking at you. She is holding the door to the ward shut with both hands, and the small shapes behind her are pressing their palms to the glass.</p>
      <p>She mouths two words. <em>Do not come back.</em></p>
      <p>The house folds itself into the dark. In the morning, the lot is empty. Your letter is inside your coat, in Elsie's handwriting:</p>
      <p class="hand"><em>Thank you for waking us. We were only sleeping. We are still only sleeping.</em></p>
      <p class="epilogue">Hushwood Institute never existed. Neither, for a while, did you.</p>
    `,
  },
};

export const SIGN_TEXT = {
  foyer: 'GRAND FOYER',
  reception: 'RECEPTION',
  intake: 'INTAKE',
  day: 'DAY ROOM',
  treatment: 'TREATMENT',
  archive: 'ARCHIVE',
  office: 'MATRON’S OFFICE',
  records: 'RECORDS',
  corridor: 'EAST CORRIDOR',
  dining: 'DINING',
  kitchen: 'KITCHEN',
  ward: 'PATIENT WARD',
  observation: 'OBSERVATION',
  quarters: 'MATRON’S QUARTERS',
  landing: 'SERVICE LANDING',
  workshop: 'WORKSHOP',
  generator: 'GENERATOR',
  cellar: 'CELLAR',
  laundry: 'LAUNDRY',
  boiler: 'BOILER',
};
