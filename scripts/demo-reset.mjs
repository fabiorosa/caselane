import argon2 from "argon2";
import postgres from "postgres";
import { assertDemoResetEnvironment } from "./demo-reset-policy.mjs";

const ORGANIZATION_ID = "10000000-0000-4000-8000-000000000001";
const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-0000-4000-8000-${String(index + 1).padStart(12, "0")}`);

assertDemoResetEnvironment(process.env);

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const now = new Date(process.env.DEMO_SEED_TIME ?? "2026-07-19T12:00:00.000Z");
const users = ids("20000000", 4); const clientIds = ids("30000000", 3); const contactIds = ids("40000000", 3); const categoryIds = ids("50000000", 3); const caseIds = ids("60000000", 12); const activityIds = ids("70000000", 12);
const passwordHash = await argon2.hash(process.env.DEMO_PASSWORD);
const caseData = [
  [1001, 0, "Purchase order field request", "NEW", "HIGH", null, 4],
  [1002, 1, "Q3 location roster", "IN_PROGRESS", "NORMAL", 2, 5],
  [1003, 0, "Finance reviewer access", "WAITING_ON_CLIENT", "NORMAL", 1, 2],
  [1004, 1, "Utilization export correction", "IN_PROGRESS", "URGENT", 2, -3],
  [1005, 2, "Contractor account archive", "RESOLVED", "LOW", 1, -1],
  [1006, 0, "Closed onboarding request", "CLOSED", "NORMAL", 2, -6],
  [1007, 2, "Billing contact update", "TRIAGED", "NORMAL", 1, 7],
  [1008, 1, "Clinic permissions review", "NEW", "HIGH", null, 1],
  [1009, 0, "Matter export question", "WAITING_ON_CLIENT", "LOW", 2, 8],
  [1010, 2, "Dashboard timezone mismatch", "IN_PROGRESS", "HIGH", 1, -1],
  [1011, 1, "SSO domain verification", "TRIAGED", "NORMAL", null, 10],
  [1012, 2, "Monthly report delivery", "RESOLVED", "NORMAL", 2, 0],
];

await sql.begin(async (tx) => {
  const existing = await tx`select id from organizations where id = ${ORGANIZATION_ID} and is_demo = true`;
  if (existing.length) await tx`delete from organizations where id = ${ORGANIZATION_ID} and is_demo = true`;
  await tx`delete from users where id = any(${users}) and email like '%@demo.caselane.dev'`;
  await tx`insert into organizations (id,name,slug,is_demo,case_sequence,created_at,updated_at) values (${ORGANIZATION_ID},'Orbit Labs','orbit-labs',true,1012,${now},${now})`;
  const people = [[users[0],"Avery Brooks","owner@demo.caselane.dev"],[users[1],"Morgan Ortiz","admin@demo.caselane.dev"],[users[2],"Jordan Singh","member@demo.caselane.dev"],[users[3],"Maya Chen","client@demo.caselane.dev"]];
  for (const [id,name,email] of people) await tx`insert into users (id,name,email,password_hash,email_verified_at,created_at,updated_at) values (${id},${name},${email},${passwordHash},${now},${now},${now})`;
  for (const [index, role] of ["OWNER","ADMIN","MEMBER","CLIENT"].entries()) await tx`insert into memberships (organization_id,user_id,role,title,active,created_at,updated_at) values (${ORGANIZATION_ID},${users[index]},${role},${role === "CLIENT" ? "Client contact" : "Operations"},true,${now},${now})`;
  for (const [index, name] of ["Northstar Legal","Hartwell Clinics","Aperture Works"].entries()) {
    await tx`insert into clients (id,organization_id,name,external_reference,created_at,updated_at) values (${clientIds[index]},${ORGANIZATION_ID},${name},${`DEMO-${index + 1}`},${now},${now})`;
    await tx`insert into client_contacts (id,organization_id,client_id,user_id,name,email,is_primary,created_at,updated_at) values (${contactIds[index]},${ORGANIZATION_ID},${clientIds[index]},${index === 0 ? users[3] : null},${index === 0 ? "Maya Chen" : `Demo Contact ${index + 1}`},${index === 0 ? "client@demo.caselane.dev" : `contact${index + 1}@demo.caselane.dev`},true,${now},${now})`;
  }
  for (const [index,name] of ["Access","Data","Billing"].entries()) await tx`insert into categories (id,organization_id,name,color,created_at,updated_at) values (${categoryIds[index]},${ORGANIZATION_ID},${name},${["#d9a441","#6f8fa8","#7aa384"][index]},${now},${now})`;
  for (const [index, item] of caseData.entries()) {
    const [sequence, clientIndex, title, status, priority, assigneeIndex, dueOffset] = item;
    const dueAt = new Date(now.getTime() + Number(dueOffset) * 86400000); const activityAt = new Date(now.getTime() - index * 3600000);
    await tx`insert into cases (id,organization_id,sequence,client_id,requester_contact_id,category_id,assignee_id,created_by_id,title,description,status,priority,due_at,resolved_at,closed_at,last_activity_at,created_at,updated_at) values (${caseIds[index]},${ORGANIZATION_ID},${sequence},${clientIds[Number(clientIndex)]},${contactIds[Number(clientIndex)]},${categoryIds[index % 3]},${assigneeIndex === null ? null : users[Number(assigneeIndex)]},${index === 6 ? users[3] : users[0]},${title},${`Fictional demo request for ${title}.`},${status},${priority},${dueAt},${status === "RESOLVED" || status === "CLOSED" ? activityAt : null},${status === "CLOSED" ? activityAt : null},${activityAt},${activityAt},${activityAt})`;
    await tx`insert into case_activities (id,organization_id,case_id,actor_id,event_type,metadata,created_at) values (${activityIds[index]},${ORGANIZATION_ID},${caseIds[index]},${users[index % 3]},${index === 0 ? "CASE_CREATED" : "STATUS_CHANGED"},${sql.json({ demo: true })},${activityAt})`;
  }
});
await sql.end();
console.log("Demo workspace reset: Orbit Labs (12 cases).");
