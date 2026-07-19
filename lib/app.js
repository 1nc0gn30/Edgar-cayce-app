import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve project root. In ESM (local dev) import.meta.url is available.
// When bundled to CommonJS by esbuild (Netlify Functions), import.meta.url is
// undefined — fall back to process.cwd() which is the function's root at runtime.
let __filename;
try {
  __filename = fileURLToPath(import.meta.url);
} catch {
  __filename = path.join(process.cwd(), 'lib', 'app.js');
}
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const app = express();
const DATA_FILE = path.join(ROOT, 'data.json');

// In-memory chat store fallback for read-only filesystems (Netlify Functions)
const memoryChats = { chats: [] };
let useMemory = false;

app.use(express.json());
// Serve frontend static assets when present (local dev + when bundled with public/).
// On Netlify the CDN serves the frontend via redirects; if public/ is absent,
// express.static just 404s silently — no crash.
const publicDir = path.join(ROOT, 'public');
if (fs.existsSync(publicDir)) app.use(express.static(publicDir));

function readDB() {
  if (useMemory) return memoryChats;
  if (!fs.existsSync(DATA_FILE)) return { chats: [] };
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (Array.isArray(d.chats)) return { chats: d.chats };
    if (Array.isArray(d.chatHistory)) return { chats: d.chatHistory }; // migrate old shape
    return { chats: [] };
  } catch { return { chats: [] }; }
}
function writeDB(db) {
  if (useMemory) { memoryChats.chats = db.chats || []; return; }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    // EROFS or similar: switch to in-memory for the rest of this function lifetime
    if (e && (e.code === 'EROFS' || e.code === 'EACCES' || /read-only|permission/i.test(e.message || ''))) {
      useMemory = true;
      memoryChats.chats = db.chats || [];
    } else {
      throw e;
    }
  }
}

// --- Real biographical data ---
const lifeTimeline = [
  { year: 1877, title: 'Birth in Kentucky', body: 'Edgar Cayce born March 18 on a farm near Beverly, seven miles south of Hopkinsville, Kentucky. Son of Leslie and Carrie Cayce.' },
  { year: 1884, title: 'First visions', body: 'At age seven, Edgar sees "little folk" around him and his grandfather\'s funeral. Begins describing his imaginary playmates to his family.' },
  { year: 1889, title: 'The angel vision', body: 'At twelve, after struggling with spelling lessons, an angelic figure appears asking what he most wants. He answers: "to be helpful to others, especially children." ' },
  { year: 1900, title: 'Laryngitis strikes', body: 'While selling insurance he loses his voice — chronic aphonia, unable to speak above a whisper for months. Doctors declare it incurable.' },
  { year: 1901, title: 'First self-reading', body: 'Hypnotist Al Layne puts Edgar in trance. In trance, Edgar describes his own condition and prescribes treatment. Voice returns. This is the first documented Cayce reading.' },
  { year: 1910, title: 'New York Times article', body: 'The New York Times Magazine runs "Illiterate Man Becomes Doctor When Hypnotized." National attention arrives.' },
  { year: 1923, title: 'First life reading', body: 'Arthur Lammers asks about reincarnation. Cayce enters trance and gives a "Life Reading" tracing past incarnations. The reincarnation era begins.' },
  { year: 1925, title: 'Move to Virginia Beach', body: 'Guided by a reading, Cayce moves his family to Virginia Beach, Virginia, calling it the center for his work.' },
  { year: 1931, title: 'A.R.E. founded', body: 'The Association for Research and Enlightenment is incorporated on February 17. Members pay $20/year to receive transcripts of readings.' },
  { year: 1940, title: '14,000+ readings', body: 'By now Cayce has given over 14,000 documented readings covering health, dreams, reincarnation, and ancient mysteries — all while in self-induced trance.' },
  { year: 1944, title: 'Final reading', body: 'On September 17, Edgar gives his last reading — for himself. He tells his wife Gertrude he is "tired, so tired." ' },
  { year: 1945, title: 'Death', body: 'Edgar Cayce dies January 3 in Virginia Beach, age 67. Gertrude dies three months later on April 2.' }
];

const areBuilding = {
  name: 'Association for Research and Enlightenment',
  founded: 'February 17, 1931',
  address: '215 67th Street, Virginia Beach, VA 23451',
  founded_by: 'Edgar Cayce',
  overview: 'A.R.E. is the headquarters campus for the work of Edgar Cayce, sitting on a 1.5-mile stretch of Atlantic oceanfront. The grounds were chosen by a Cayce reading itself, which described Virginia Beach as "the place where the work is to be done." The campus holds the readings archive, a meditation garden, a health center, library, and visitor center — all open to the public.',
  features: [
    { title: 'The Readings Archive', body: 'Over 14,000 documented psychic readings preserved in a climate-controlled vault. Each reading was stenographed by Gladys Davis Turner, Edgar\'s secretary for 22 years. They remain the largest psychic record ever compiled.' },
    { title: 'Meditation Garden', body: 'A circular open-air meditation garden at the campus center, built on a ley-line-style design. Daily group meditation is held at noon — free, open to anyone, no reservation needed.' },
    { title: 'A.R.E. Health Center & Spa', body: 'Houses the only fully-licensed outpatient clinic implementing Cayce remedies — castor oil packs, wet-cell appliances, osteopathic manipulation, colonics — alongside modern integrative care.' },
    { title: 'The Library & Visitor Center', body: 'Free admission. Houses original reading transcripts, photographs, and rotating exhibits on Cayce\'s life. Hosts year-round lectures and conferences.' },
    { title: 'Atlantic University', body: 'Founded by Cayce in 1930, re-chartered 1985. Offers an MA in Transpersonal Psychology and continuing-Ed courses in dreamwork, intuition, mindfulness.' },
    { title: 'The New Millennium Building', body: 'Conference and lecture hall hosting the annual Ancient Mysteries Conference, Reincarnation Symposium, and Summer Reading Conference.' }
  ],
  random_facts: [
    'Edgar chose Virginia Beach after a reading told him "in Virginia, by the sea, the work will be built." He had never visited before moving there in 1925.',
    'The A.R.E. campus sits directly on the Atlantic oceanfront — readings said sea air helped the trance state.',
    'Gladys Davis Turner took shorthand for 22 years, producing the 14,000+ transcripts that survive today.',
    'The meditation garden was designed around Cayce\'s favorite affirmation: "Let the work of the Father be done through me."',
    'A.R.E. has over 30,000 active members across 40+ countries and 1,400+ study groups worldwide.',
    'The campus library contains every known reading, indexed by topic — health, dreams, reincarnation, Atlantis, Egypt, Jesus, and more.',
    'Admission to the visitor center, garden, and beach access is free. Daily noon meditation has been held since 1931.',
    'A.R.E. survived near-bankruptcy in the 1940s after Edgar\'s death, rebuilt by son Hugh Lynn Cayce into today\'s campus.',
    'The Cayce Hospital (1928–1930) was Edgar\'s attempt at a healing hospital; it collapsed during the Depression but became the foundation for A.R.E.',
    'Annual Ancient Mysteries Conference brings archaeologists, Egyptologists, and researchers to Virginia Beach every October.'
  ]
};

const readingsOverview = {
  total: 14306,
  categories: [
    {
      name: 'Physical / Health Readings',
      icon: 'fa-heart-pulse',
      count: '~9,600 (two-thirds of all readings)',
      body: 'The majority of readings addressed illness — arthritis, epilepsy, psoriasis, multiple sclerosis, infertility, and rare conditions. Cayce prescribed castor oil packs, atomidine, wet-cell appliances, osteopathic adjustments, diet, and mental attitude. Many remedies are still sold today.',
      samples: [
        'For psoriasis (reading 2455-2): "Eliminate all fried foods. Use the castor oil packs over the liver for three days, then the slippery elm and American saffron tea morning and evening."',
        'For epilepsy (reading 949-3): "Wet-cell appliance attached along the spine, with gold and silver chloride solutions alternating. Combined with osteopathic manipulation and low-pressure hydrotherapy."'
      ]
    },
    {
      name: 'Life Readings (Reincarnation)',
      icon: 'fa-rotate',
      count: '~1,900',
      body: 'Beginning September 1923 with Arthur Lammers, Edgar traced individuals through past incarnations across Atlantis, Egypt, Persia, Rome, and the Americas — describing how past actions shaped present tendencies and life purpose.',
      samples: [
        'Reading 443-2: "The entity was in Atlantis during the first upheaval, when the sons of Belial and the children of the Law of One made war upon each other. The entity sided with the Law of One and carried the records to Egypt."',
        'Reading 938-1: "In Egypt, the entity was a priest in the Temple of Sacrifice, helping souls learn to purify body and mind. This is why the entity now feels drawn to healers and teachers."'
      ]
    },
    {
      name: 'Dream Readings',
      icon: 'fa-cloud-moon',
      count: '~630',
      body: 'Cayce interpreted dream symbols for individuals and taught that dreams are the subconscious — and sometimes the soul itself — speaking in metaphor. He emphasized recording dreams immediately on waking.',
      samples: [
        'Reading 294-53: "Dreams, my friend, are the activity of the subconscious mind. They come as warnings, as unfoldments, as messages from those who would guide."',
        'Reading 900-301 on dreaming of water: "Water is the symbol of life and of cleansing. To dream of troubled water means emotional turmoil. To see clear water is the promise of renewal."'
      ]
    },
    {
      name: 'Mental-Spiritual Readings',
      icon: 'fa-dove',
      count: '~450',
      body: 'These address purpose, faith, the Christ consciousness, the Law of One, and the soul\'s relationship with the Creator. Cayce\'s most quoted teachings come from these readings.',
      samples: [
        'Reading 397-5: "For the spirit is the life, the mind is the builder, the physical is the result. Let each in their own way stand in the presence of the Creator."',
        'Reading 254-87: "Service is the price of peace of mind. There is no shortcut to the presence of the Father save through service to thy fellow man."'
      ]
    },
    {
      name: 'Historical / Ancient Mysteries',
      icon: 'fa-landmark',
      count: '~700',
      body: 'Readings on Atlantis, ancient Egypt, the Hall of Records, the Essenes, the Jesus narratives, and the Sphinx. These spawned books, conferences, and decades of archaeological debate.',
      samples: [
        'Reading 364-1: "Atlantis was a land in the Atlantic. Poseidia was the last portion to sink, around 10,700 BC. The entity lived there before the final destruction."',
        'Reading 5748-6: "Between the paws of the Sphinx, in a chamber lined with linseed, there lies the Hall of Records — the records of Atlantis, of Egypt, and of those who came to build."'
      ]
    }
  ]
};

const mysteries = [
  {
    title: 'Atlantis',
    icon: 'fa-water',
    summary: 'Cayce described Atlantis as a vast Atlantic continent destroyed in three cataclysms (50,000 BC, 28,000 BC, and 10,700 BC).',
    details: [
      'Atlantis had advanced technology — flying machines (airsips), crystal power, and the "terrible mighty crystal" that focused sun energy.',
      'Two factions warred: the spiritual "Children of the Law of One" and the materialist "Sons of Belial" who enslaved and exploited.',
      'Survivors fled to Egypt and the Yucatan, carrying records. Poseidia was the last island to sink in 10,700 BC.',
      'Reading 364-11: "In Atlantis the entity was a priestess who carried the records of the Law of One to the land of Egypt, hiding them in the tomb that was later sealed."'
    ]
  },
  {
    title: 'The Hall of Records',
    icon: 'fa-vault',
    summary: 'A prophesied chamber beneath the Sphinx paw containing records of Atlantis, Egypt, and the origins of civilization.',
    details: [
      'Reading 5748-1 says: "There is a chamber or vault — lined with linseed — between the paws of the Sphinx. It holds the records of Atlantis and the first Egyptians."',
      'A second Hall is said to lie in the Yucatan (Iltar\'s temple), and a third under the sunken Poseidia.',
      'Cayce dated the chamber\'s opening to around 1998 in reading 5748-5 — a date that came and went without confirmation.',
      'Modern research: radar anomalies detected beneath the Sphinx in the 1990s by Thomas Dobecki and Robert Schoch — disputed but not fully refuted.'
    ]
  },
  {
    title: 'Jesus, the Essenes & the Pyramids',
    icon: 'fa-cross',
    summary: 'Cayce gave 171 readings on the Essenes, Jesus\'s family, the Pyramids, and the Great Pyramid in particular.',
    details: [
      'The pyramids were built circa 10,500 BC by the Atlantean refugees with Egyptian priests — not by slaves. The Great Pyramid was a temple of initiation.',
      'Reading 5748-6: "The Great Pyramid was built as a house of records for those who followed, and as a temple of initiation for the masters who would lead."',
      'Jesus was a member of the Essene community at Mt. Carmel; Mary and Joseph were Essenes. The readings expand the hidden years of Jesus\'s life.',
      'Cayce dated the beginning of Jesus\'s ministry to AD 30 and described a hidden chamber in the Pyramid called "the heart" where initiates faced three tests.'
    ]
  },
  {
    title: 'Earth Changes & Prophecy',
    icon: 'fa-earth-americas',
    summary: 'Cayce foresaw major geophysical changes — some believed to have begun, others unfulfilled.',
    details: [
      'Reading 3976-15 (1941): "The earth will be broken up in the western portion of America. The greater portion of Japan must go into the sea."',
      'Predicted New York, Los Angeles, and San Francisco would experience destruction before "the new era" — dates given as the late 20th century, now unfulfilled.',
      'Pole shift prophecy: "There will be the shifting of the poles, or a new cycle begins." Reading 826-8 gives this as gradual, not overnight.',
      'Skeptics note many Cayce predictions failed to materialize. Defenders argue some events (climate change, tsunami activity) track the readings\' broader tone.'
    ]
  },
  {
    title: 'Reincarnation & Karma',
    icon: 'fa-infinity',
    summary: 'Over 2,500 Life Readings traced souls across incarnations — a central pillar of the Cayce material.',
    details: [
      'Cayce himself, in reading 294-8, was identified as a reincarnation of the Egyptian high priest Ra-Ta and as a past incarnation of Hermes.',
      'Relationships repeat across lives: spouses, parents, and rivals return to balance debts and resume growth.',
      'Karma is not punishment — it is "the meeting of self." Each soul is given the chance to face what it once avoided.',
      'Reading 3395-1: "Each soul enters the earth for a purpose, and that purpose is to learn to love God and to serve. The failures become the lessons."'
    ]
  },
  {
    title: 'Akashic Records',
    icon: 'fa-book',
    summary: 'Cayce claimed to read from the "Book of Life" — a universal record of every soul\'s thoughts, actions, and lifetimes.',
    details: [
      'Reading 254-39: "When the body is in the attunement, the records of the soul are as an open book. The Akashic is the record of all that has been and may be."',
      'Each soul has a "record" — an energetic imprint — accessible in deep states of consciousness.',
      'The Book of Life in the Cayce material parallels Hindu and Theosophical Akashic concepts but is grounded in Christian mystical language.',
      'Cayce would typically begin a reading with: "Yes, we have the body and the record here."'
    ]
  }
];

const scenarios = [
  {
    id: '1901',
    year: 1901,
    title: 'The First Self-Reading',
    category: 'Physical Healing',
    icon: 'fa-stethoscope',
    person: 'Edgar Cayce (for himself)',
    summary: 'Edgar had been unable to speak above a whisper for nearly a year. In a trance he described his own condition and prescribed the treatment that cured him.',
    excerpt: 'The condition is of a reflex nature, produced from a partial dislocation of the sympathetic nerves in the region of the larynx. The remedy would be to produce, by suggestion while in this state, the stimulation that will cause the muscles of the vocal cords to react. Increase the circulation to the area; suggest to the body that the voice will return.',
    context: 'Hypnotist Al Layne read Edgar\'s prescription aloud and followed it. Within a day, Edgar\'s voice returned — the first documented Cayce reading, and the start of 44 years of trance work.'
  },
  {
    id: '1923',
    year: 1923,
    title: 'The First Life Reading',
    category: 'Reincarnation',
    icon: 'fa-rotate',
    person: 'Arthur Lammers, printer & metaphysician',
    summary: 'Lammers asked Cayce about reincarnation. In trance, Edgar traced a soul across past incarnations — opening the "Life Reading" era.',
    excerpt: 'Before this the entity was in the land of the Persians, during the reign of Cyrus, when the peoples were gathered from many lands. The entity was a teacher of the young, one who sought to bring the understanding of the one God to those who wandered. The entity gained in that experience through patience and through giving.',
    context: 'Before September 10, 1923, Cayce\'s readings were almost all physical. After this session, the Life Readings became a permanent category — over 1,900 of them.'
  },
  {
    id: '2455-2',
    year: 1941,
    title: 'Psoriasis Reading 2455-2',
    category: 'Physical Healing',
    icon: 'fa-hand-dots',
    person: 'A 46-year-old man with severe psoriasis',
    summary: 'One of the most famous health readings. Cayce prescribed castor oil packs, slippery elm tea, and American saffron — remedies still sold today.',
    excerpt: 'We would eliminate all fried foods from the diet. Use the castor oil packs over the liver and gallbladder area for three days in succession, each day for an hour to an hour and a half. Then take internally the slippery elm bark tea and the American saffron tea, morning and evening. These will, with the eliminations properly set up, correct the disturbance.',
    context: 'Reading 2455-2 became the template for Cayce\'s psoriasis protocol. Modern A.R.E. case studies report sustained remission in patients who followed it for 6–12 months.'
  },
  {
    id: '949-3',
    year: 1935,
    title: 'Epilepsy Reading 949-3',
    category: 'Physical Healing',
    icon: 'fa-bolt',
    person: 'A young girl with seizures since childhood',
    summary: 'Cayce described epilepsy as a nervous-system imbalance and prescribed a "wet-cell" electrical appliance along the spine.',
    excerpt: 'The condition is produced by the lack of coordination between the sympathetic and cerebrospinal nervous systems. We would use the wet-cell appliance, attached along the spine — first at the 2nd and 3rd dorsal, then at the 9th dorsal and 1st lumbar. The gold and silver chloride solutions alternate. Combine with osteopathic manipulation and gentle hydrotherapy.',
    context: 'The wet-cell appliance was a low-voltage battery Cayce prescribed over 600 times. The A.R.E. still builds them for research; some patients reported dramatic seizure reduction.'
  },
  {
    id: '364-1',
    year: 1932,
    title: 'Atlantis Reading 364-1',
    category: 'Ancient Mysteries',
    icon: 'fa-water',
    person: 'A study group asking about Atlantis',
    summary: 'Cayce described Atlantis as a real continent in the Atlantic, destroyed in three cataclysms over 40,000 years.',
    excerpt: 'Atlantis was a land in the Atlantic. Poseidia was the last portion to sink — around 10,700 years before the Prince of Peace came. The civilization reached heights of understanding in the application of the universal laws, but turned to self-aggrandizement. The final destruction came through the misuse of the crystal forces that powered their cities.',
    context: 'The Atlantis readings (364 series) spawned decades of books, conferences, and oceanographic speculation. Cayce never visited the Atlantic seabed — all descriptions came in trance.'
  },
  {
    id: '5748-6',
    year: 1932,
    title: 'The Hall of Records 5748-6',
    category: 'Ancient Mysteries',
    icon: 'fa-vault',
    person: 'A study group asking about Egypt',
    summary: 'Cayce described a hidden chamber beneath the Sphinx paw containing records of Atlantis and ancient Egypt.',
    excerpt: 'Between the paws of the Sphinx, in a chamber lined with linseed, there lies the Hall of Records. It holds the records of Atlantis, the records of those who came to Egypt to preserve them, and the records of the first peoples of this land. When the time is right, these will be opened.',
    context: 'Cayce dated the chamber\'s opening to around 1998 (reading 5748-5) — a date that passed without confirmation. 1990s radar surveys by Thomas Dobecki found anomalies beneath the Sphinx paw; the findings remain disputed.'
  },
  {
    id: '294-8',
    year: 1925,
    title: 'Edgar\'s Own Past Life — Ra-Ta',
    category: 'Reincarnation',
    icon: 'fa-ankh',
    person: 'Edgar Cayce (Life Reading for himself)',
    summary: 'Cayce learned that he had been the Egyptian high priest Ra-Ta, who helped design the first pyramid and the Hall of Records.',
    excerpt: 'The entity was in Egypt when the peoples were gathered from many lands. The entity was the priest Ra-Ta, who led the peoples in the understanding of the one God. The entity, with Hermes, laid the foundations for the records that would endure — the Hall of Initiation, the chamber of the Sphinx.',
    context: 'The Ra-Ta readings became the backbone of Cayce\'s Egyptian narrative. He described himself working alongside "Hermes" (a past incarnation of Jesus) to build the Great Pyramid as a temple of initiation around 10,500 BC.'
  },
  {
    id: '3976-15',
    year: 1941,
    title: 'Earth Changes Prophecy 3976-15',
    category: 'Prophecy',
    icon: 'fa-earth-americas',
    person: 'A study group asking about the future',
    summary: 'Cayce foresaw major geophysical changes — the west coast of America broken up, much of Japan into the sea.',
    excerpt: 'The earth will be broken up in the western portion of America. The greater portion of Japan must go into the sea. The upper portion of Europe will be changed as in the twinkling of an eye. There will be the open waters of the Arctic and Antarctic, and then the new era begins.',
    context: 'Many Cayce earth-change predictions for the late 20th century did not come to pass. Defenders point to climate change, rising seas, and seismic activity as partial fulfillment. Skeptics cite this series as evidence the readings were not infallible.'
  },
  {
    id: '294-53',
    year: 1923,
    title: 'On Dreams 294-53',
    category: 'Dreams',
    icon: 'fa-cloud-moon',
    person: 'A man asking how to understand his dreams',
    summary: 'Cayce explained dreams as the activity of the subconscious — guidance from the soul.',
    excerpt: 'Dreams, my friend, are the activity of the subconscious mind. They come as warnings, as unfoldments, as messages from those who would guide. The dream that is forgotten is as the letter unopened. Keep a record. Interpret not by the symbol alone, but by the feeling the dream leaves upon the body.',
    context: 'Cayce gave over 630 dream readings. He insisted dreams be recorded immediately on waking, before movement or speech, because the soul\'s language fades fastest in the body\'s return to the world.'
  },
  {
    id: '254-87',
    year: 1935,
    title: 'Service and the Soul 254-87',
    category: 'Mental-Spiritual',
    icon: 'fa-hands-holding-circle',
    person: 'A man struggling with purpose',
    summary: 'One of Cayce\'s most quoted spiritual teachings — service is the price of peace of mind.',
    excerpt: 'Service is the price of peace of mind. There is no shortcut to the presence of the Father save through service to thy fellow man. Each soul is given the opportunity, in its own sphere, to be of service. The soul that refuses becomes as the salt that has lost its savor.',
    context: 'Reading 254-87 is among the most reprinted of all Cayce readings. The theme of service recurs in over 400 mental-spiritual readings and became the A.R.E.\'s founding principle.'
  },
  {
    id: '900-301',
    year: 1936,
    title: 'Dream Symbols 900-301',
    category: 'Dreams',
    icon: 'fa-droplet',
    person: 'A woman dreaming of water',
    summary: 'Cayce decoded the meaning of water in dreams — troubled water as emotional turmoil, clear water as renewal.',
    excerpt: 'Water is the symbol of life and of cleansing. To dream of troubled water means there is emotional turmoil in the conscious life of the body — fears and anxieties that disturb the soul. To see clear water is the promise of renewal, that the way will be made plain. The water that rises is the spirit; the water that is troubled is the flesh.',
    context: 'Cayce treated dream symbolism as consistent across individuals. Water, falling, flying, animals, and houses each had stable meanings in the readings — but always filtered through the dreamer\'s life.'
  },
  {
    id: '5748-1',
    year: 1932,
    title: 'Great Pyramid as Initiation Temple 5748-1',
    category: 'Ancient Mysteries',
    icon: 'fa-mountain',
    person: 'A study group asking about the pyramids',
    summary: 'Cayce said the Great Pyramid was not a tomb but a temple of initiation — built around 10,500 BC by Atlantean refugees.',
    excerpt: 'The Great Pyramid was built as a house of records for those who followed, and as a temple of initiation for the masters who would lead. It was not built by slaves, but by those who understood the law. The entity that was Hermes laid the capstone. The records within tell of the passage of the soul through the various stages of initiation.',
    context: 'Cayce dated the Great Pyramid to circa 10,500 BC — far older than mainstream archaeology\'s ~2,560 BC. The "Hall of Initiation" he described inside has never been confirmed, but the readings influenced esoteric Egyptology for decades.'
  }
];

const prophecies = [
  {
    id: 'stock294',
    year: 1925,
    title: '1929 Stock Market Crash',
    status: 'fulfilled',
    icon: 'fa-chart-line',
    summary: 'Cayce gave readings in the late 1920s warning of a major financial upheaval. Reading 294-188 explicitly described a "great disturbance in the financial world" coming.',
    excerpt: 'There will be disturbances in the financial world that will affect many. Those who have placed their trust in the things of the world will find them as naught. The changes will come in a manner that few expect.',
    context: 'The 1929 crash triggered the Great Depression. Cayce himself lost much of his fortune in the crash, despite having warned others.'
  },
  {
    id: 'ww2',
    year: 1935,
    title: 'Second World War',
    status: 'fulfilled',
    icon: 'fa-shield-halved',
    summary: 'Years before 1939, Cayce described a war that would involve Austria, Germany, Japan, and would draw in America.',
    excerpt: 'The lands across the waters — Austria, Germany, Japan — will become as one in purpose, and the land of the eagle will be drawn in. The conflict will not end until the heart of many has been broken.',
    context: 'This was given when Nazi Germany was still remilitarizing the Rhineland. The U.S. did not enter the war until 1941 — six years after this reading.'
  },
  {
    id: 'israel',
    year: 1933,
    title: 'Establishment of Israel',
    status: 'fulfilled',
    icon: 'fa-dove',
    summary: 'Reading 416-3 described the Jewish people returning to their homeland and establishing a nation — 15 years before 1948.',
    excerpt: 'There will be the gathering again of the peoples of that land, the Israelites, to their own land. And this will be accomplished in the midst of strife, yet will it be accomplished.',
    context: 'The State of Israel was established on May 14, 1948, fifteen years after this reading, in the aftermath of WWII and the Holocaust.'
  },
  {
    id: 'deaths',
    year: 1943,
    title: 'Death of Two Presidents',
    status: 'fulfilled',
    icon: 'fa-cross',
    summary: 'Cayce predicted that a sitting U.S. president would die in office, and that there would be another before the "change" he foresaw.',
    excerpt: 'There will come the passing of one who holds the high office, and then another, before the changes that are to come in the earth are completed.',
    context: 'Franklin D. Roosevelt died April 12, 1945. Cayce himself died January 3, 1945 — three months earlier. Some interpret this reading as referring to FDR and JFK.'
  },
  {
    id: 'atlantis567',
    year: 1933,
    title: 'Rising of Atlantis',
    status: 'unfulfilled',
    icon: 'fa-water',
    summary: 'Cayce predicted that portions of Atlantis would rise again near Bimini in 1968 or 1969.',
    excerpt: 'Poseidia will be part of the records that will rise again in \'68 or \'69. There will be seen portions of the temple of the Atlantean land — the temple of the sun, the temple of the Law of One — rising from the sea floor.',
    context: 'In 1968, divers discovered the "Bimini Road" — a rectangular rock formation in shallow water off Bimini. Debate continues: some call it a natural beachrock formation, others cite it as partial fulfillment of Cayce\'s prophecy.'
  },
  {
    id: 'sphinx98',
    year: 1932,
    title: 'Hall of Records Opened by 1998',
    status: 'unfulfilled',
    icon: 'fa-vault',
    summary: 'Cayce dated the opening of the hidden Hall of Records beneath the Sphinx to approximately 1998.',
    excerpt: 'This may be opened in \'98. The records will be found. The time is near when these things will be brought to light.',
    context: '1998 came and went without the Hall being opened. A.R.E. funded a decade of geological surveys near the Sphinx; radar anomalies were detected by Thomas Dobecki and Robert Schoch in the 1990s, but no chamber has been excavated or confirmed.'
  },
  {
    id: 'pole',
    year: 1936,
    title: 'Shifting of the Poles',
    status: 'pending',
    icon: 'fa-compass',
    summary: 'Cayce described a gradual shifting of the earth\'s poles, beginning in 1936 and accelerating.',
    excerpt: 'There will be the shifting of the poles, or a new cycle begins. This will begin in \'36, and will gradually grow. The magnetic poles will shift, and this will bring changes in climate and in the relationships of land and sea.',
    context: 'Magnetic north has been drifting measurably since the 19th century and accelerated in the 1990s — roughly when Cayce said the shift would intensify. Geologists note this is a natural geomagnetic process, not a catastrophic pole flip.'
  },
  {
    id: 'china',
    year: 1943,
    title: 'China Becomes Christian',
    status: 'unfulfilled',
    icon: 'fa-cross',
    summary: 'Cayce predicted that China would one day become "the cradle of Christianity, as applied in the lives of men."',
    excerpt: 'And the yellow race, the Chinese, will become the cradle of Christianity, as applied in the lives of men. The greater part of Japan must go into the sea.',
    context: 'Christianity has grown rapidly in China since the 1980s — estimates suggest 60–100 million Chinese Christians today. Whether this constitutes "the cradle" as Cayce described remains debated.'
  },
  {
    id: 'climate',
    year: 1941,
    title: 'Arctic and Antarctic Ice Melt',
    status: 'pending',
    icon: 'fa-temperature-arrow-up',
    summary: 'Reading 3976-15 predicted open waters in the Arctic and Antarctic — a phenomenon now accelerating.',
    excerpt: 'There will be the open waters of the Arctic and the Antarctic, and then the new era begins. These are signs.',
    context: 'Arctic sea ice has declined dramatically since 1979; the Northwest Passage opened seasonally in 2007. Antarctic ice shelves are weakening. This prophecy is often cited as partial fulfillment of Cayce\'s broader earth-changes vision.'
  }
];

const remedies = [
  {
    id: 'castor-oil',
    name: 'Castor Oil Pack',
    icon: 'fa-oil-can',
    category: 'Detox & Healing',
    used_for: ['Liver detox', 'Psoriasis', 'Arthritis', 'Digestive issues', 'Adhesions'],
    protocol: 'Saturate a flannel cloth with castor oil. Place over the liver (right side, below ribs). Cover with plastic, then a heating pad on medium for 1–1.5 hours, three days in a row. Rest during. Wash skin with baking soda afterward.',
    science: 'Ricinoleic acid in castor oil has documented anti-inflammatory effects. Modern studies show castor oil packs increase lymphocyte production and improve gut motility. The A.R.E. Health Center still uses this protocol.',
    reading_ref: 'Reading 2455-2, and prescribed in over 500 individual readings'
  },
  {
    id: 'wet-cell',
    name: 'Wet-Cell Appliance',
    icon: 'fa-bolt',
    category: 'Nervous System',
    used_for: ['Epilepsy', 'Multiple sclerosis', 'Parkinson\'s', 'Nervous disorders', 'Paralysis'],
    protocol: 'A low-voltage battery (approx 1.5V) with two electrodes attached along the spine. Solutions of gold chloride and silver chloride alternate through the circuit. Sessions last 30 minutes to an hour, daily.',
    science: 'Cayce prescribed this over 600 times. The A.R.E. still builds wet-cell units for research. No peer-reviewed clinical trials exist, but case reports describe seizure reduction in epilepsy patients.',
    reading_ref: 'Reading 949-3 and over 600 related prescriptions'
  },
  {
    id: 'atomidine',
    name: 'Atomidine (Iodine)',
    icon: 'fa-flask',
    category: 'Glandular',
    used_for: ['Throid imabalance', 'Glandular issues', 'Energy', 'Immunity', 'Skin conditions'],
    protocol: '1–3 drops of atomidine (a detoxified iodine) in half a glass of water, taken morning and evening. Cycle: 5 days on, 5 days off. Cayce prescribed different doses for different conditions.',
    science: 'Atomidine is still sold by the A.R.E. today. It contains iodine trichloride in a reduced form. Modern endocrinology recognizes iodine\'s role in thyroid function; Cayce\'s "detoxified" version remains controversial.',
    reading_ref: 'Prescribed in over 1,200 readings'
  },
  {
    id: 'slippery-elm',
    name: 'Slippery Elm & American Saffron Tea',
    icon: 'fa-mug-hot',
    category: 'Digestion & Skin',
    used_for: ['Psoriasis', 'Eczema', 'Stomach ulcers', 'IBS', 'Acid reflux'],
    protocol: 'Slippery elm bark tea: 1 teaspoon in a cup of warm water, morning and evening. American saffron tea: a pinch in a cup of warm water, similarly taken. Continue for 6–12 months for skin conditions.',
    science: 'Slippery elm contains mucilage that coats and soothes the digestive tract — confirmed by herbal medicine. American saffron (Carthamus tinctorius) has documented anti-inflammatory properties. Both are still sold.',
    reading_ref: 'Reading 2455-2 and dozens of psoriasis readings'
  },
  {
    id: 'osteopathy',
    name: 'Osteopathic Manipulation',
    icon: 'fa-bone',
    category: 'Structural',
    used_for: ['Back pain', 'Headaches', 'Coordination issues', 'Nervous system', 'Circulation'],
    protocol: 'Regular osteopathic adjustments focusing on the spine, particularly the dorsal and lumbar regions. Cayce often specified exact vertebrae. Weekly sessions for chronic conditions.',
    science: 'Osteopathic manipulative treatment (OMT) is a recognized medical practice today. The A.R.E. Health Center employs osteopathic physicians as part of integrative care.',
    reading_ref: 'Prescribed in over 2,000 readings — the most common physical remedy'
  },
  {
    id: 'diet',
    name: 'Cayce Diet Principles',
    icon: 'fa-apple-whole',
    category: 'Lifestyle',
    used_for: ['Overall health', 'Longevity', 'Energy', 'Mental clarity', 'Disease prevention'],
    protocol: 'Eat 80% alkaline-forming foods (vegetables, fruits, almonds) and 20% acid-forming (meats, grains). Do not combine starches with proteins. Avoid fried foods, pork, and white sugar. Drink 6–8 glasses of water daily. Chew thoroughly.',
    science: 'Modern nutrition recognizes the benefits of vegetable-heavy diets. The "no starch + protein" rule resembles modern food-combining theories, which have limited clinical support but don\'t harm. The 80/20 ratio aligns with Mediterranean and DASH diets.',
    reading_ref: 'Recommended in over 4,000 readings'
  }
];

const famousPeople = [
  { name: 'Woodrow Wilson', role: '28th U.S. President', icon: 'fa-user-tie', reading: 'Cayce gave readings for people close to the Wilson administration. While no direct reading for Wilson himself is documented, several readings addressed policies and decisions of his era.' },
  { name: 'Thomas Edison', role: 'Inventor', icon: 'fa-lightbulb', reading: 'Edison was reportedly interested in Cayce\'s work. A reading (294-2) mentions Edison by name, suggesting Edison and Cayce would work together "in the years to come" — a collaboration that never materialized due to Edison\'s death in 1931.' },
  { name: 'Harry Houdini', role: 'Magician & Escapologist', icon: 'fa-magic', reading: 'Houdini, who spent years debunking psychics, reportedly encountered Cayce but never formally investigated him. No documented reading exists, but Houdini\'s assistant reported meeting Cayce.' },
  { name: 'George Estabrooks', role: 'Psychology Professor, Harvard', icon: 'fa-graduation-cap', reading: 'Estabrooks studied Cayce and wrote about him in academic circles. He remained skeptical but acknowledged he could not explain how an uneducated man produced medical diagnoses.' },
  { name: 'Gladys Davis Turner', role: 'Cayce\'s Secretary for 22 years', icon: 'fa-pen-nib', reading: 'Took shorthand for nearly every reading from 1923 to 1944. Her transcripts are the sole record of over 14,000 readings. She dedicated her life to preserving and indexing the Cayce material.' },
  { name: 'Hugh Lynn Cayce', role: 'Edgar\'s son & A.R.E. chairman', icon: 'fa-users', reading: 'After Edgar\'s death in 1945, Hugh Lynn rebuilt the A.R.E. from near-bankruptcy into today\'s 30,000-member organization. He defended and promoted his father\'s work until his own death in 1982.' },
  { name: 'Arthur Lammers', role: 'Printer & Metaphysician', icon: 'fa-print', reading: 'The man who asked the reincarnation question in 1923, triggering the first Life Reading. His question transformed Cayce\'s work from physical healing to spiritual exploration.' },
  { name: 'David Kahn', role: 'Journalist & Promoter', icon: 'fa-newspaper', reading: 'Kahn brought national attention to Cayce through magazine articles in the 1920s. He became one of Edgar\'s closest friends and most effective promoters for over two decades.' }
];

const quotes = [
  'The spirit is the life, the mind is thebuilder, the physical is the result.',
  'Service is the price of peace of mind.',
  'For, he that would be the greatest among you, let him be the servant of all.',
  'The mind is the builder. What you think, you become.',
  'Dreams are today\'s answers to tomorrow\'s questions.',
  'There is no shortcut to the presence of the Father save through service.',
  'Each soul enters the earth for a purpose, and that purpose is to learn to love God and to serve.',
  'The purpose of life is to meet the Creator, and the way is through service.',
  'When you are in harmony with the divine, all things work together for good.',
  'Healing of the physical without change in the mental and spiritual aspects brings little real help.'
];

const meditations = {
  affirmations: [
    'I am in the presence of the Infinite. I open myself to its guidance.',
    'The spirit is the life; the mind is the builder; the physical is the result.',
    'I am a soul, a child of the Creator, with a purpose uniquely my own.',
    'I let the work of the Father be done through me this day.',
    'Day by day, in every way, I am growing more and more in harmony with the divine.',
    'I seek not to be ministered unto, but to minister.',
    'The Father, the Son, and the Holy Spirit dwell within me.',
    'I am one with the universal consciousness; all fear departs.'
  ],
  steps: [
    { num: 1, title: 'Set aside 15–30 minutes', body: 'Find a quiet place. Early morning before sunrise was the time Cayce recommended. Sit upright — do not lie down.' },
    { num: 2, title: 'Relax the body', body: 'Close your eyes. Take slow breaths. Mentally relax each part of the body from feet to head.' },
    { num: 3, title: 'Raise the vibration', body: 'Cayce taught that during meditation the body\'s vibration rises. This is a natural process — do not force it.' },
    { num: 4, title: 'Use an affirmation', body: 'Repeat the affirmation silently, with meaning. Three to nine times. Let the words move through you.' },
    { num: 5, title: 'Sit in the silence', body: 'After the affirmation, sit in the silence. Listen. Do not expect — simply receive. This is the "attunement" Cayce spoke of.' },
    { num: 6, title: 'Return slowly', body: 'When the time is complete, bring awareness back. Write down any impressions or images. Do not rush into activity.' }
  ]
};

// --- Engagement replies (keyword-aware, Cayce-voiced) ---
// Each topic has multiple variants. craftReply() tracks recently-used replies
// per-topic in memory to avoid repeating the same line back-to-back.
const replyBank = {
  greeting: [
    'Welcome, friend. Sit a moment. What would you ask of the readings?',
    'Peace be with you. The mind that is in attunement may receive. What is your question?',
    'You have come. Rest the body, quiet the mind, and ask. I am here.',
    'Greetings, seeker. The channel is open. Speak what is on the heart.'
  ],
  health: [
    'The body is the temple of the living soul. Cayce taught that disease begins in the mind before it manifests in the flesh. Castor oil packs over the liver, osteopathic adjustments, a clean diet — these he prescribed again and again.',
    'For the body, remember: eliminate well, assimilate well, and keep right thinking. Cayce warned that anger, fear, and worry disturb the body\'s vibrations more than poor food.',
    'Cayce\'s first principle of healing: the body heals itself when given the right conditions — rest, elimination, right attitude, and the natural remedies he prescribed in over 9,000 readings.',
    'Look to the spine. Many of Cayce\'s physical readings returned again and again to osteopathic adjustments and the coordination between the nervous systems. The spine is the body\'s switchboard.',
    'Castor oil packs, atomidine, slippery elm tea, the wet-cell appliance — these were his tools. He prescribed them not as cures, but as aids to the body\'s own healing intelligence.'
  ],
  dream: [
    'Dreams are the activity of the soul — the language of the subconscious speaking in symbol. Keep a notebook by your bed. Write the moment you wake, before the world intrudes.',
    'In dreams, my friend, water is life, troubled water is emotion. Falling is the loss of control. Flying is expansion. Each symbol speaks to the soul\'s own state.',
    'Cayce gave over 630 dream readings. He insisted the dream be recorded before the body moves or speaks — for the soul\'s language fades fastest on waking.',
    'Do not interpret the symbol alone, Cayce taught. Interpret the feeling the dream leaves upon the body. The soul speaks in atmosphere, not only in image.'
  ],
  reincarnation: [
    'Each soul returns, again and again, until it has learned what it came to learn. We meet the same souls — as parents, children, rivals — to balance what was once begun.',
    'The entity known as Edgar was, in Egypt, the priest Ra-Ta. We all have lived. The question is not whether, but what we have made of each life.',
    'Karma is not punishment. It is the meeting of self. Each soul is given the chance to face what it once avoided — in love, in loss, in service.',
    'From September 1923, Cayce gave over 1,900 Life Readings, tracing souls through Atlantis, Egypt, Persia, Rome, and the Americas. Each life was a lesson; each lesson a step toward the Creator.'
  ],
  atlantis: [
    'Atlantis was. It sank in three upheavals — the last in 10,700 BC. The Children of the Law of One fled to Egypt carrying records. The Sphinx holds those records still.',
    'Poseidia was the last land of Atlantis to sink. The entity in that land was a keeper of records, a priest, an artisan — each soul had its part.',
    'Two factions warred in Atlantis: the Children of the Law of One, who remembered the Creator, and the Sons of Belial, who sought power. The misuse of the crystal brought the final destruction.',
    'Cayce said survivors carried records to three places: Egypt, the Yucatan, and a sunken chamber beneath Poseidia. The Hall of Records beneath the Sphinx awaits its opening.'
  ],
  purpose: [
    'Your purpose is not a job or a title. It is the soul\'s design — to love, to serve, to grow. Ask: where can I be of use today? There the purpose reveals itself.',
    'Service is the price of peace of mind. The soul that serves finds itself; the soul that takes loses itself.',
    'Each soul enters the earth for a purpose, and that purpose is to learn to love God and to serve. The failures become the lessons.',
    'Cayce taught: the mind is the builder. What you think upon, you become. Hold the ideal of service, and the path will make itself known.'
  ],
  virginia: [
    'Virginia Beach is where the work was built. A reading told us to go to Virginia, by the sea, and there the A.R.E. was founded in 1931. It stands there still.',
    'The A.R.E. is at 215 67th Street, Virginia Beach. The reading chamber, the meditation garden, the archive of all 14,000 readings — all are there. Visitors welcome.',
    'A reading said: "In Virginia, by the sea, the work will be built." Edgar had never visited. He moved his family there in 1925 and the campus grew around him.'
  ],
  egypt: [
    'In Egypt, the priest Ra-Ta (a past incarnation of Edgar) worked with Hermes to build the Great Pyramid as a temple of initiation, around 10,500 BC.',
    'The Hall of Records lies between the paws of the Sphinx — a chamber lined with linseed holding the records of Atlantis and the first Egyptians. Cayce dated its opening to around 1998.',
    'Cayce said the pyramids were not built by slaves but by those who understood the law. The Great Pyramid was a house of records and a temple of initiation for the masters who would lead.',
    'The Essenes at Mt. Carmel prepared the way for the Christ. Cayce gave 171 readings on the Essenes, Mary, Joseph, and the hidden years of Jesus\'s life.'
  ],
  jesus: [
    'Cayce spoke of the Christ consciousness — the pattern for every soul, not the man of Galilee alone. To seek the Christ within is the work of every lifetime.',
    'Jesus was a member of the Essene community at Mt. Carmel, Cayce said. Mary and Joseph were Essenes. The readings fill in the hidden years the Gospels do not record.',
    'The spirit is the life, the mind is the builder, the physical is the result — and the Christ is the pattern. So Cayce summarized the path.'
  ],
  akashic: [
    'The Akashic Records are the Book of Life — the record of every soul\'s thoughts, actions, and lifetimes. In trance, Cayce read from them as from an open book.',
    'Cayce would begin a reading: "Yes, we have the body and the record here." The record was not in a book on a shelf — it was in the attunement itself.',
    'Every soul has a record. To read it, the mind must be attuned. Cayce\'s gift was not the information itself but the state of attunement that let him receive it.'
  ],
  meditation: [
    'Prayer is asking. Meditation is listening. Both are needed. One without the other is half a conversation.',
    'Cayce recommended meditation at sunrise, sitting upright, never lying down. Slow the breath, relax the body, raise the vibration, then sit in the silence and listen.',
    'The affirmation is the rudder. Repeat it silently, with meaning, three to nine times. Then sit in the silence and receive. This is the attunement Cayce spoke of.',
    'Healing of the physical without change in the mental and spiritual aspects brings little real help. Meditation is where the change begins.'
  ],
  prayer: [
    'Prayer is the conscious mind speaking to the Creator. Meditation is the soul listening back. Cayce taught both — together they form the full conversation.',
    'When you pray, believe you receive. Cayce echoed the Gospels: faith is the substance of things hoped for, the evidence of things not seen.'
  ],
  fear: [
    'Fear is the opposite of faith. It disturbs the body\'s vibrations more than any illness. Cayce taught: replace fear with the consciousness of the Creator\'s presence.',
    'Why worry? Cayce said worry kills more than work. Trust the process. The soul that trusts opens the channel; the soul that fears closes it.'
  ],
  relationships: [
    'We meet the same souls again and again — as parents, children, spouses, rivals. Each relationship is a chance to balance what was once begun.',
    'In marriage, Cayce taught mutual service. Neither is master. The ideal is two souls walking the same direction, each helping the other toward the Creator.',
    'Difficult people are often the souls we once wronged. Cayce said: the meeting is not by chance. The relationship is the lesson.'
  ],
  default: [
    'The spirit is the life; the mind is the builder; the physical is the result. This is the cornerstone of every reading I have given.',
    'Let the work of the Father be done through me. So began each day. So may yours begin.',
    'Seek the Christ within. Not the man of Galilee alone, but the consciousness that is the pattern for every soul.',
    'There is no shortcut. Each soul must walk its own path. The readings are a lamp — they do not walk for you.',
    'Prayer is asking. Meditation is listening. Both are needed. One without the other is half a conversation.',
    'The mind is the builder. What you think upon, you become. Guard the thought, and you guard the life.',
    'Sit a moment longer. The answer comes in the silence, not in the asking.'
  ]
};

const topicMatchers = [
  { topic: 'greeting',     re: /^(hi|hello|hey|greet|peace|yo|sup|howdy|good (morning|evening|afternoon))/ },
  { topic: 'health',       re: /(health|body|sick|ill|pain|cure|heal|diet|remedy|arthritis|psoriasis|castor|wet-cell|atomidine|spine|digest)/ },
  { topic: 'dream',        re: /(dream|sleep|night|nightmare|symbol|vision)/ },
  { topic: 'reincarnation',re: /(reincarn|past life|karma|past-life|incarnation|soul return)/ },
  { topic: 'atlantis',     re: /(atlantis|poseidia|lemuria|continent|bimini|children of (the )?one|belial)/ },
  { topic: 'egypt',        re: /(egypt|sphinx|pyramid|ra-ta|ra ta|pharaoh|nile|cairo|giza|hall of records)/ },
  { topic: 'jesus',        re: /(jesus|christ|essene|mary|joseph|galilee|gospel|bible|christian)/ },
  { topic: 'akashic',      re: /(akashic|book of life|record|akasha)/ },
  { topic: 'meditation',   re: /(meditat|breath|attune|attunement|affirmation|silence|contemplat)/ },
  { topic: 'prayer',       re: /(pray|prayer|faith|god|creator|father)/ },
  { topic: 'fear',         re: /(fear|worry|anxious|anxiety|afraid|scared|dread)/ },
  { topic: 'relationships',re: /(relationship|marriage|spouse|partner|love|family|parent|child|friend|enemy|divorce)/ },
  { topic: 'virginia',     re: /(virginia|beach|are|a\.r\.e\.|building|headquarter|campus|atlantic university)/ },
  { topic: 'purpose',      re: /(purpose|why am i|meaning|destiny|calling|why am i here|what should i do)/ }
];

// Track recently used replies per topic to avoid immediate repeats
const recentReplies = {};
function pick(arr, topic) {
  const seen = recentReplies[topic] || [];
  let candidates = arr.filter((_, i) => !seen.includes(i));
  if (candidates.length === 0) {
    // reset when all have been used
    recentReplies[topic] = [];
    candidates = arr;
  }
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  const idx = arr.indexOf(choice);
  recentReplies[topic] = [...(recentReplies[topic] || []), idx].slice(-Math.max(2, Math.floor(arr.length / 2)));
  return choice;
}

function craftReply(text) {
  const t = String(text).toLowerCase().trim();
  if (!t || t === '__reset__') return pick(replyBank.greeting, 'greeting');
  for (const { topic, re } of topicMatchers) {
    if (re.test(t)) return pick(replyBank[topic], topic);
  }
  return pick(replyBank.default, 'default');
}

// --- Global search across all content collections ---
function buildSearchIndex() {
  const idx = [];
  for (const t of lifeTimeline) idx.push({ type: 'life', title: t.title, body: t.body, year: t.year, view: 'life' });
  for (const f of areBuilding.features) idx.push({ type: 'are', title: f.title, body: f.body, view: 'are' });
  for (const f of areBuilding.random_facts) idx.push({ type: 'fact', title: 'A.R.E. Fact', body: f, view: 'are' });
  idx.push({ type: 'are', title: areBuilding.name, body: areBuilding.overview, view: 'are' });
  for (const c of readingsOverview.categories) {
    idx.push({ type: 'reading', title: c.name, body: c.body, view: 'readings' });
    for (const s of c.samples) idx.push({ type: 'reading', title: c.name, body: s, view: 'readings' });
  }
  for (const m of mysteries) {
    idx.push({ type: 'mystery', title: m.title, body: m.summary, view: 'mysteries' });
    for (const d of m.details) idx.push({ type: 'mystery', title: m.title, body: d, view: 'mysteries' });
  }
  for (const p of prophecies) idx.push({ type: 'prophecy', title: p.title, body: p.summary + ' ' + p.excerpt + ' ' + p.context, year: p.year, view: 'prophecies' });
  for (const r of remedies) idx.push({ type: 'remedy', title: r.name, body: r.protocol + ' ' + r.science, view: 'remedies' });
  for (const s of scenarios) idx.push({ type: 'scenario', title: s.title, body: s.summary + ' ' + s.excerpt, view: 'engage' });
  for (const p of famousPeople) idx.push({ type: 'person', title: p.name, body: p.reading, view: 'life' });
  for (const q of quotes) idx.push({ type: 'quote', title: 'Cayce Quote', body: q, view: 'engage' });
  return idx;
}
const searchIndex = buildSearchIndex();

// --- API ---
app.get('/api/life', (req, res) => res.json(lifeTimeline));
app.get('/api/are', (req, res) => res.json(areBuilding));
app.get('/api/readings', (req, res) => res.json(readingsOverview));
app.get('/api/mysteries', (req, res) => res.json(mysteries));
app.get('/api/meditations', (req, res) => res.json(meditations));
app.get('/api/scenarios', (req, res) => res.json(scenarios));
app.get('/api/prophecies', (req, res) => res.json(prophecies));
app.get('/api/remedies', (req, res) => res.json(remedies));
app.get('/api/people', (req, res) => res.json(famousPeople));
app.get('/api/quotes', (req, res) => res.json(quotes));

// Daily quote — deterministic by date so it's the same all day
app.get('/api/daily-quote', (req, res) => {
  const dayKey = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) >>> 0;
  res.json({ quote: quotes[h % quotes.length], date: dayKey });
});

// Global search across all content collections
app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  if (!q || q.length < 2) return res.json({ results: [], query: q });
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const item of searchIndex) {
    const title = String(item.title || '').toLowerCase();
    const body = String(item.body || '').toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 3;
      if (body.includes(term)) score += 1;
      if (title.startsWith(term)) score += 2;
    }
    if (score > 0) {
      // snippet: first ~140 chars around first match
      const src = String(item.body || '');
      const li = src.toLowerCase().indexOf(terms[0]);
      const start = Math.max(0, li - 40);
      const snippet = (start > 0 ? '…' : '') + src.slice(start, start + 160) + (src.length > start + 160 ? '…' : '');
      scored.push({ type: item.type, title: item.title, view: item.view, year: item.year, score, snippet });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  res.json({ results: scored.slice(0, 30), query: q, total: scored.length });
});

app.post('/api/chat', (req, res) => {
  const message = String((req.body && req.body.message) || '').trim();
  const reply = craftReply(message);
  const db = readDB();
  if (message && message !== '__reset__') {
    db.chats.push({ role: 'user', text: message, time: Date.now() });
    db.chats.push({ role: 'cayce', text: reply, time: Date.now() });
    if (db.chats.length > 100) db.chats = db.chats.slice(-100);
    writeDB(db);
  }
  res.json({ reply, history: db.chats.slice(-40) });
});

app.get('/api/chat', (req, res) => {
  const db = readDB();
  res.json({ history: db.chats.slice(-40) });
});

app.get('/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// SPA fallback. Local dev: serve index.html from public/. Netlify: the CDN's
// netlify.toml redirect handles SPA routing before the function sees non-API
// paths, so guard against a missing file to avoid throwing in the function.
app.use((req, res) => {
  const indexFile = path.join(ROOT, 'public', 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(404).json({ error: 'Not found' });
});

export { app };
