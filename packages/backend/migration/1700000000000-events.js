/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Events1700000000000 {
    name = 'Events1700000000000'

    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "event" (
                "id" character varying(32) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "userId" character varying(32) NOT NULL,
                "bannerId" character varying(32),
                "title" character varying(128) NOT NULL,
                "description" character varying(4096) NOT NULL,
                "participantsCount" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_b3a25444c9bc076510308d10beb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_event_createdAt" ON "event" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_event_endsAt" ON "event" ("endsAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_event_userId" ON "event" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_event_bannerId" ON "event" ("bannerId")
        `);

        await queryRunner.query(`
            CREATE TABLE "event_participant" (
                "id" character varying(32) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "userId" character varying(32) NOT NULL,
                "eventId" character varying(32) NOT NULL,
                CONSTRAINT "PK_a1a65c1807d35bae1bddf12fc0d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_event_participant_createdAt" ON "event_participant" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_event_participant_userId" ON "event_participant" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_event_participant_eventId" ON "event_participant" ("eventId")
        `);

        await queryRunner.query(`
            ALTER TABLE "event" ADD CONSTRAINT "FK_event_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event" ADD CONSTRAINT "FK_event_bannerId" FOREIGN KEY ("bannerId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_participant" ADD CONSTRAINT "FK_event_participant_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_participant" ADD CONSTRAINT "FK_event_participant_eventId" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "event_participant" DROP CONSTRAINT "FK_event_participant_eventId"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_participant" DROP CONSTRAINT "FK_event_participant_userId"
        `);
        await queryRunner.query(`
            ALTER TABLE "event" DROP CONSTRAINT "FK_event_bannerId"
        `);
        await queryRunner.query(`
            ALTER TABLE "event" DROP CONSTRAINT "FK_event_userId"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_event_participant_eventId"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_event_participant_userId"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_event_participant_createdAt"
        `);
        await queryRunner.query(`
            DROP TABLE "event_participant"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_event_bannerId"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_event_userId"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_event_endsAt"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_event_createdAt"
        `);
        await queryRunner.query(`
            DROP TABLE "event"
        `);
    }
}
