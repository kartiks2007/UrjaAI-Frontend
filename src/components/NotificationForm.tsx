import { z } from "zod";
import { useResource } from "../api/hooks";
import { DataForm } from "./DataForm";
import { ResourceState } from "./ResourceState";
import { Feedback } from "./ui";
interface Preferences { whatsapp_number: string | null; whatsapp_enabled: boolean; whatsapp_verified_at: string | null }
const schema = z.object({
  whatsapp_number: z.union([z.literal(""), z.string().regex(/^\+[1-9]\d{7,14}$/, "Use an international number, for example +91…")]),
  whatsapp_enabled: z.enum(["OFF", "ON"]),
}).refine(value => value.whatsapp_enabled !== "ON" || value.whatsapp_number !== "", {path:["whatsapp_number"],message:"Enter a number to enable WhatsApp notifications."}).transform(value => ({...value,whatsapp_enabled:value.whatsapp_enabled === "ON"}));
export function NotificationForm() {
  const query = useResource<Preferences>("/users/me/notifications");
  const prefs = query.data;
  return <ResourceState query={query}>
    <p>WhatsApp notifications require consent, a verified destination and a configured Twilio integration.</p>
    {prefs?.whatsapp_enabled && !prefs.whatsapp_verified_at && <Feedback kind="info" title="Destination verification required">An administrator must verify your destination and consent before messages can be sent.</Feedback>}
    <DataForm key={JSON.stringify(prefs)} path="/users/me/notifications" method="PUT" schema={schema} fields={[
      {name:"whatsapp_number",label:"WhatsApp number",type:"tel",value:prefs?.whatsapp_number},
      {name:"whatsapp_enabled",label:"Receive WhatsApp notifications",type:"select",options:["OFF","ON"],value:prefs?.whatsapp_enabled ? "ON" : "OFF"},
    ]}/>
  </ResourceState>;
}
