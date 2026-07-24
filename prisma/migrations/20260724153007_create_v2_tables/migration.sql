Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "UserV2" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceV2" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipV2" (
    "id" SERIAL NOT NULL,
    "relation" TEXT NOT NULL,
    "userSubjectId" INTEGER,
    "resourceSubjectId" INTEGER,
    "objectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipV2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserV2_email_key" ON "UserV2"("email");

-- CreateIndex
CREATE INDEX "RelationshipV2_objectId_relation_idx" ON "RelationshipV2"("objectId", "relation");

-- AddForeignKey
ALTER TABLE "RelationshipV2" ADD CONSTRAINT "RelationshipV2_userSubjectId_fkey" FOREIGN KEY ("userSubjectId") REFERENCES "UserV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipV2" ADD CONSTRAINT "RelationshipV2_resourceSubjectId_fkey" FOREIGN KEY ("resourceSubjectId") REFERENCES "ResourceV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipV2" ADD CONSTRAINT "RelationshipV2_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ResourceV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

