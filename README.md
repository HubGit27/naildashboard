# Brandon Notes
how to run application - 


Prisma - This application uses postgres sql, but with prisma, any sql database can be subsituted
"npm install prisma"
"npx prisma init" to create prisma folder and shema.prisma
check env file for database url
"npx prisma migrate dev --name init" to map the schema.prisma to an sql table file
"npm prisma studio" - go to localhost:5555 to show your tables in prisma. Can also manually add data here
Instead of manually adding data, use seed.ts file to add example data into the file. To run this file, prisma seed needs to be added to package.json
"npm i -d ts-node" install dependency to use seed file
"npx prisma db seed" - to run seed file and populate database
"npx prisma migrate reset" - reset database then runs seed
If there is a issue, delete .next folder and run application again because of possible cache issue
"npx prisma db push --force-reset" - reset database after changing the schema

Clerk - login/ authentication to protect routes
"npm install @clerk/nextjs"
go to clerk online dashboard and create application
add enviornment variables to .env


docker - installer docker on docker.com and create account.
Search for postgres image. port number 5431, in environment varaibles, add postgres_user, postgres_password, postgres_dbName
In the env file, add the variables to database url

# Lama Dev School Management Dashboard

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Lama Dev Youtube Channel](https://youtube.com/lamadev) 
- [Next.js](https://nextjs.org/learn)