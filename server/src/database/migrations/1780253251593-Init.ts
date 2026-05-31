import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1780253251593 implements MigrationInterface {
    name = 'Init1780253251593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."users_language_enum" AS ENUM('en', 'pl', 'ru', 'de')`);
        await queryRunner.query(`CREATE TYPE "public"."users_theme_enum" AS ENUM('light', 'dark', 'system')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "login" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "status" boolean NOT NULL DEFAULT true, "statusEmail" boolean NOT NULL DEFAULT false, "phone" character varying, "regionId" integer, "cityId" integer, "districtId" integer, "language" "public"."users_language_enum" NOT NULL DEFAULT 'en', "theme" "public"."users_theme_enum" NOT NULL DEFAULT 'light', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."media_files_type_enum" AS ENUM('avatar', 'lot_image', 'chat_image', 'chat_document')`);
        await queryRunner.query(`CREATE TYPE "public"."media_files_visibility_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`CREATE TABLE "media_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."media_files_type_enum" NOT NULL, "visibility" "public"."media_files_visibility_enum" NOT NULL DEFAULT 'private', "mimeType" character varying NOT NULL, "size" integer NOT NULL, "path" character varying NOT NULL, "lotId" uuid, "isPrimary" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_93b4da6741cd150e76f9ac035d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a8366b84e4dbf5fd210d30ad8b" ON "media_files" ("lotId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8cfa31648f9bfdb58c30a12801" ON "media_files" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "email_confirmations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_05ca1f7be84ddf4039009f8221e" UNIQUE ("token"), CONSTRAINT "PK_178b5599cd7e3ec9cfdfb144b50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "refreshTokenHash" text, "ip" character varying, "userAgent" character varying, "deviceId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" boolean NOT NULL DEFAULT true, "user_id" uuid NOT NULL, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "account_deactivation_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codeHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_0785adfe2b68873106c5ad4f422" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_812d432fc516e311aa2ec3c407" ON "account_deactivation_codes" ("user_id", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."lots_visibilitystatus_enum" AS ENUM('hidden', 'active', 'archived')`);
        await queryRunner.query(`CREATE TABLE "lots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "chapterId" integer NOT NULL, "categoryId" integer NOT NULL, "subcategoryId" integer, "generalDescription" character varying NOT NULL, "characteristicsDescription" text NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "visibilityStatus" "public"."lots_visibilitystatus_enum" NOT NULL DEFAULT 'hidden', "regionId" integer NOT NULL, "cityId" integer NOT NULL, "districtId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "imageLinks" text array NOT NULL DEFAULT '{}', CONSTRAINT "PK_2bb990a4015865cb1daa1d22fd9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5962d38c6ad9f759c74090eabf" ON "lots" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."user_taxonomy_preferences_targettype_enum" AS ENUM('chapter', 'category', 'subcategory')`);
        await queryRunner.query(`CREATE TABLE "user_taxonomy_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "targetType" "public"."user_taxonomy_preferences_targettype_enum" NOT NULL, "targetId" integer NOT NULL, "weight" smallint NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_user_taxonomy_preferences_weight" CHECK ("weight" BETWEEN 1 AND 3), CONSTRAINT "PK_dec562699c2b78a343c76574b51" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_user_taxonomy_preferences_user_type" ON "user_taxonomy_preferences" ("userId", "targetType") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_taxonomy_preferences_target" ON "user_taxonomy_preferences" ("userId", "targetType", "targetId") `);
        await queryRunner.query(`ALTER TABLE "media_files" ADD CONSTRAINT "FK_8cfa31648f9bfdb58c30a128014" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_confirmations" ADD CONSTRAINT "FK_930e1d7c0171d23e5535b1e3873" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_deactivation_codes" ADD CONSTRAINT "FK_b11a307501b19651d1131add9c9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_deactivation_codes" DROP CONSTRAINT "FK_b11a307501b19651d1131add9c9"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`);
        await queryRunner.query(`ALTER TABLE "email_confirmations" DROP CONSTRAINT "FK_930e1d7c0171d23e5535b1e3873"`);
        await queryRunner.query(`ALTER TABLE "media_files" DROP CONSTRAINT "FK_8cfa31648f9bfdb58c30a128014"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_taxonomy_preferences_target"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_taxonomy_preferences_user_type"`);
        await queryRunner.query(`DROP TABLE "user_taxonomy_preferences"`);
        await queryRunner.query(`DROP TYPE "public"."user_taxonomy_preferences_targettype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5962d38c6ad9f759c74090eabf"`);
        await queryRunner.query(`DROP TABLE "lots"`);
        await queryRunner.query(`DROP TYPE "public"."lots_visibilitystatus_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_812d432fc516e311aa2ec3c407"`);
        await queryRunner.query(`DROP TABLE "account_deactivation_codes"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "email_confirmations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8cfa31648f9bfdb58c30a12801"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8366b84e4dbf5fd210d30ad8b"`);
        await queryRunner.query(`DROP TABLE "media_files"`);
        await queryRunner.query(`DROP TYPE "public"."media_files_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."media_files_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_theme_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_language_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
