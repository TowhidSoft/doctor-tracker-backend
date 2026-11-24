/**
 * Demo data for Doctor Tracker: 14 doctors and ~150 patients spread over the last 90 days,
 * so the dashboard charts, filters and pagination have something to show.
 *
 *   npm run seed:doctors            # adds data only when there are no doctors yet
 *   npm run seed:doctors -- --reset # wipes doctors + patients first
 */
import "dotenv/config";
import { Gender } from "@prisma/client";
import prisma from "../config/db.prisma";

const DAY = 24 * 60 * 60 * 1000;

const DOCTORS = [
  ["Dr. Ayesha Rahman", "Cardiology", "Square Hospital"],
  ["Dr. Imran Hossain", "Cardiology", "United Hospital"],
  ["Dr. Nusrat Jahan", "Neurology", "Evercare Hospital"],
  ["Dr. Tanvir Ahmed", "Orthopedics", "Popular Medical College Hospital"],
  ["Dr. Farzana Akter", "Pediatrics", "Dhaka Shishu Hospital"],
  ["Dr. Sabbir Khan", "Dermatology", "Labaid Hospital"],
  ["Dr. Mehnaz Chowdhury", "Gynecology", "Square Hospital"],
  ["Dr. Rafiq Islam", "General Medicine", "Ibn Sina Hospital"],
  ["Dr. Sumaiya Karim", "Endocrinology", "BIRDEM General Hospital"],
  ["Dr. Kamrul Hasan", "Gastroenterology", "United Hospital"],
  ["Dr. Tasnim Sultana", "Psychiatry", "Evercare Hospital"],
  ["Dr. Arif Mahmud", "Urology", "Labaid Hospital"],
  ["Dr. Lamia Haque", "Ophthalmology", "Ispahani Islamia Eye Institute"],
  ["Dr. Zahid Siddique", "ENT", "Ibn Sina Hospital"],
] as const;

const CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Migraine",
  "Asthma",
  "Back Pain",
  "Anemia",
  "Thyroid Disorder",
  "Allergic Rhinitis",
  "Arthritis",
  "Gastritis",
  "Anxiety",
  "Skin Allergy",
];

const FIRST = ["Rahim", "Karim", "Sadia", "Nabila", "Tariq", "Mitu", "Shuvo", "Rima", "Jamal", "Farhan", "Sumi", "Anika", "Hasan", "Mim", "Rony", "Tania", "Sohel", "Lima", "Faisal", "Joya"];
const LAST = ["Uddin", "Begum", "Mia", "Khatun", "Roy", "Das", "Sarker", "Mondal", "Talukder", "Sheikh", "Biswas", "Paul"];
const GENDERS: Gender[] = [Gender.Male, Gender.Female, Gender.Female, Gender.Male, Gender.Others];

// Deterministic pseudo-random so every run yields the same demo set.
let seed = 20261123;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];

async function main() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    await prisma.patient.deleteMany();
    await prisma.doctor.deleteMany();
    console.log("Cleared doctors and patients.");
  } else if ((await prisma.doctor.count()) > 0) {
    console.log("Doctors already exist - nothing seeded. Use --reset to start over.");
    return;
  }

  const now = Date.now();
  const doctorIds: string[] = [];

  for (const [index, [name, specialization, hospital]] of DOCTORS.entries()) {
    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialization,
        hospital,
        phone: `+8801${7 + (index % 3)}${String(10000000 + index * 7919).slice(0, 8)}`,
        email: `${name.toLowerCase().replace(/^dr\.\s*/, "").replace(/[^a-z]+/g, ".")}@doctortracker.demo`,
        createdAt: new Date(now - Math.floor(rand() * 85) * DAY - Math.floor(rand() * DAY)),
      },
    });
    doctorIds.push(doctor.id);
  }

  const patients = Array.from({ length: 150 }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    return {
      name: `${first} ${last}`,
      age: 3 + Math.floor(rand() * 82),
      gender: pick(GENDERS),
      phone: `+88017${String(10000000 + Math.floor(rand() * 89999999))}`,
      email: i % 3 === 0 ? null : `${first}.${last}${i}@mail.demo`.toLowerCase(),
      condition: pick(CONDITIONS),
      notes: i % 4 === 0 ? "Follow-up visit scheduled." : null,
      doctorId: pick(doctorIds),
      createdAt: new Date(now - Math.floor(rand() * 90) * DAY - Math.floor(rand() * DAY)),
    };
  });

  await prisma.patient.createMany({ data: patients });
  console.log(`Seeded ${doctorIds.length} doctors and ${patients.length} patients.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
