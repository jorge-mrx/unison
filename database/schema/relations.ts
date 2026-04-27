import { relations } from "drizzle-orm";
import { users } from "./users";
import { songs } from "./songs";
import { userFavorites } from "./userFavorites";
import { groups } from "./groups";
import { groupMembers } from "./groupMembers";
import { setlists } from "./setlists";
import { setlistSongs } from "./setlistSongs";

export const usersRelations = relations(users, ({ many }) => ({
  songs: many(songs),
  favorites: many(userFavorites),
  ownedGroups: many(groups),
  memberships: many(groupMembers),
  setlists: many(setlists),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  author: one(users, {
    fields: [songs.authorUserId],
    references: [users.id],
  }),
  favorites: many(userFavorites),
  setlistEntries: many(setlistSongs),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [userFavorites.songId],
    references: [songs.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, {
    fields: [groups.ownerUserId],
    references: [users.id],
  }),
  members: many(groupMembers),
  setlists: many(setlists),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const setlistsRelations = relations(setlists, ({ one, many }) => ({
  ownerUser: one(users, {
    fields: [setlists.ownerUserId],
    references: [users.id],
  }),
  ownerGroup: one(groups, {
    fields: [setlists.ownerGroupId],
    references: [groups.id],
  }),
  songs: many(setlistSongs),
}));

export const setlistSongsRelations = relations(setlistSongs, ({ one }) => ({
  setlist: one(setlists, {
    fields: [setlistSongs.setlistId],
    references: [setlists.id],
  }),
  song: one(songs, {
    fields: [setlistSongs.songId],
    references: [songs.id],
  }),
}));
