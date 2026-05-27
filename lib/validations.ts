import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .min(1, "El email es obligatorio")
  .email("Email inválido")
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "Máximo 128 caracteres");

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  email: emailField,
  password: passwordField,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional();

const bpmField = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;
      const n = Number(value);
      return Number.isInteger(n) && n >= 20 && n <= 400;
    },
    "BPM debe ser un número entre 20 y 400",
  );

export const createSongSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  artist: optionalTrimmed(120),
  originalKey: optionalTrimmed(8),
  capo: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const n = Number(value);
        return Number.isInteger(n) && n >= 0 && n <= 12;
      },
      "Capo debe ser entre 0 y 12",
    ),
  bpm: bpmField,
  genre: optionalTrimmed(60),
  tags: optionalTrimmed(200),
  contentChordPro: z
    .string()
    .min(1, "Agrega al menos una línea de letra")
    .max(20000, "Máximo 20000 caracteres"),
  notes: optionalTrimmed(1000),
  authorGuestName: optionalTrimmed(80),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;

export const updateSongSchema = createSongSchema.omit({ authorGuestName: true });
export type UpdateSongInput = z.infer<typeof updateSongSchema>;

export const createSetlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "Máximo 120 caracteres"),
  eventDate: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine(
      (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Fecha inválida (formato YYYY-MM-DD)",
    ),
  venue: optionalTrimmed(120),
  notes: optionalTrimmed(1000),
  ownerGroupPublicId: optionalTrimmed(64),
});

export type CreateSetlistInput = z.infer<typeof createSetlistSchema>;

export const updateSetlistSongSchema = z.object({
  keyOverride: optionalTrimmed(8),
  setlistSpecificNotes: optionalTrimmed(500),
});

export type UpdateSetlistSongInput = z.infer<typeof updateSetlistSongSchema>;

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "Máximo 80 caracteres"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const inviteToGroupSchema = z.object({
  email: emailField,
});

export type InviteToGroupInput = z.infer<typeof inviteToGroupSchema>;
