/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Events1744500000000 {
    name = 'Events1744500000000'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "event" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE, "lastNotedAt" TIMESTAMP WITH TIME ZONE, "userId" character varying(32), "name" character varying(128) NOT NULL, "description" character varying(2048), "bannerId" character varying(32), "pinnedNoteIds" character varying(128) array NOT NULL DEFAULT '{}', "color" character varying(16) NOT NULL DEFAULT '#86b300', "isArchived" boolean NOT NULL DEFAULT false, "notesCount" integer NOT NULL DEFAULT '0', "usersCount" integer NOT NULL DEFAULT '0', "isSensitive" boolean NOT NULL DEFAULT false, "allowRenoteToExternal" boolean NOT NULL DEFAULT true, "startDate" TIMESTAMP WITH TIME ZONE, "endDate" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_event_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_event_lastNotedAt" ON "event" ("lastNotedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_userId" ON "event" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_isArchived" ON "event" ("isArchived") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_notesCount" ON "event" ("notesCount") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_usersCount" ON "event" ("usersCount") `);

        await queryRunner.query(`CREATE TABLE "event_following" ("id" character varying(32) NOT NULL, "followeeId" character varying(32) NOT NULL, "followerId" character varying(32) NOT NULL, CONSTRAINT "PK_event_following_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_event_following_followeeId" ON "event_following" ("followeeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_following_followerId" ON "event_following" ("followerId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_event_following_followerId_followeeId" ON "event_following" ("followerId", "followeeId") `);

        await queryRunner.query(`CREATE TABLE "event_favorite" ("id" character varying(32) NOT NULL, "eventId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_event_favorite_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_event_favorite_eventId" ON "event_favorite" ("eventId") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_favorite_userId" ON "event_favorite" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_event_favorite_userId_eventId" ON "event_favorite" ("userId", "eventId") `);

        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_event_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_event_bannerId" FOREIGN KEY ("bannerId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_following" ADD CONSTRAINT "FK_event_following_followeeId" FOREIGN KEY ("followeeId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_following" ADD CONSTRAINT "FK_event_following_followerId" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_favorite" ADD CONSTRAINT "FK_event_favorite_eventId" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_favorite" ADD CONSTRAINT "FK_event_favorite_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "event_favorite" DROP CONSTRAINT "FK_event_favorite_userId"`);
        await queryRunner.query(`ALTER TABLE "event_favorite" DROP CONSTRAINT "FK_event_favorite_eventId"`);
        await queryRunner.query(`ALTER TABLE "event_following" DROP CONSTRAINT "FK_event_following_followerId"`);
        await queryRunner.query(`ALTER TABLE "event_following" DROP CONSTRAINT "FK_event_following_followeeId"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_event_bannerId"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_event_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_event_favorite_userId_eventId"`);
        await queryRunner.query(`DROP INDEX "IDX_event_favorite_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_event_favorite_eventId"`);
        await queryRunner.query(`DROP TABLE "event_favorite"`);
        await queryRunner.query(`DROP INDEX "IDX_event_following_followerId_followeeId"`);
        await queryRunner.query(`DROP INDEX "IDX_event_following_followerId"`);
        await queryRunner.query(`DROP INDEX "IDX_event_following_followeeId"`);
        await queryRunner.query(`DROP TABLE "event_following"`);
        await queryRunner.query(`DROP INDEX "IDX_event_usersCount"`);
        await queryRunner.query(`DROP INDEX "IDX_event_notesCount"`);
        await queryRunner.query(`DROP INDEX "IDX_event_isArchived"`);
        await queryRunner.query(`DROP INDEX "IDX_event_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_event_lastNotedAt"`);
        await queryRunner.query(`DROP TABLE "event"`);
    }
}
