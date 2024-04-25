# ChatLabs

<img width="1464" alt="image" src="https://github.com/writingmate/chatlabs/assets/420428/aad7706f-8b8d-4671-b668-0e38babc5f09">


ChatLabs is all-in-one LLM chat platform with access to over 20+ LLMs in one place. 
It comes with Web Search and Image Generation plugins included.

ChatLabs is a fork of the [ChatbotUI](https://github.com/mckaywrigley/chatbot-ui) project.

## Demo

View the latest demo [here](https://twitter.com/avysotsky/status/1765805788402995206).

## Official Hosted Version

Use ChatLabs without having to host it yourself!

Find the official hosted version of ChatLabs [here](https://labs.writingmate.ai).

## Issues

We restrict "Issues" to actual issues related to the codebase.

We're getting excessive amounts of issues that amount to things like feature requests, cloud provider issues, etc.

If you are having issues with things like setup, please refer to the "Help" section in the "Discussions" tab above.

Issues unrelated to the codebase will likely be closed immediately.

## Discussions

We highly encourage you to participate in the "Discussions" tab above!

Discussions are a great place to ask questions, share ideas, and get help.

Odds are if you have a question, someone else has the same question.

## Updating

In your terminal at the root of your local ChatLabs repository, run:

```bash
npm run update
```

If you run a hosted instance you'll also need to run:

```bash
npm run db-push
```

to apply the latest migrations to your live database.

## Local Quickstart

Follow these steps to get your own ChatLabs instance running locally.

### 1. Clone the Repo

```bash
git clone https://github.com/writingmate/chatlabs.git
```

### 2. Install Dependencies

Open a terminal in the root directory of your local ChatLabs repository and run:

```bash
npm install
```

### 3. Install Supabase & Run Locally

#### 1. Install Docker

You will need to install Docker to run Supabase locally. You can download it [here](https://docs.docker.com/get-docker) for free.

#### 2. Install Supabase CLI

**MacOS/Linux**

```bash
brew install supabase/tap/supabase
```

**Windows**

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### 3. Start Supabase

In your terminal at the root of your local ChatLabs repository, run:

```bash
supabase start
```

### 4. Fill in Secrets

#### 1. Environment Variables

In your terminal at the root of your local ChatLabs repository, run:

```bash
cp .env.local.example .env.local
```

#### 2. Additional env variables for supabase

Please do not share these credentials with anyone. This is a quickfix and we need to figure out how to encorporate these into the env file above.

```
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=xxx
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=xxx
```

Get the required values by running:

```bash
supabase status
```

Note: Use `API URL` from `supabase status` for `NEXT_PUBLIC_SUPABASE_URL`

Now go to your `.env.local` file and fill in the values.

If the environment variable is set, it will disable the input in the user settings.

#### 2. SQL Setup

In the 1st migration file `supabase/migrations/20240108234540_setup.sql` you will need to replace 2 values with the values you got above:

- `project_url` (line 53): `http://supabase_kong_chatbotui:8000` (default) can remain unchanged if you don't change your `project_id` in the `config.toml` file
- `service_role_key` (line 54): You got this value from running `supabase status`

This prevents issues with storage files not being deleted properly.

### 5. Install Ollama (optional for local models)

Follow the instructions [here](https://github.com/ollama/ollama#macos).

### 6. Run app locally

In your terminal at the root of your local ChatLabs repository, run:

```bash
npm run chat
```

Your local instance of ChatLabs should now be running at [http://localhost:3000](http://localhost:3000). Be sure to use a compatible node version (i.e. v18).

You can view your backend GUI at [http://localhost:54323/project/default/editor](http://localhost:54323/project/default/editor).

## Hosted Quickstart

Follow these steps to get your own ChatLabs instance running in the cloud.

Video tutorial coming soon.

### 1. Follow Local Quickstart

Repeat steps 1-4 in "Local Quickstart" above. If you want to use Ollama, also follow the instructions linked in step 5.

You will want separate repositories for your local and hosted instances.

Create a new repository for your hosted instance of ChatLabs on GitHub and push your code to it.

### 2. Setup Backend with Supabase

#### 1. Create a new project

Go to [Supabase](https://supabase.com/) and create a new project.

#### 2. Get Project Values

Once you are in the project dashboard, click on the "Project Settings" icon tab on the far bottom left.

Here you will get the values for the following environment variables:

- `Project Ref`: Found in "General settings" as "Reference ID"

- `Project ID`: Found in the URL of your project dashboard (Ex: https://supabase.com/dashboard/project/<YOUR_PROJECT_ID>/settings/general)

While still in "Settings" click on the "API" text tab on the left.

Here you will get the values for the following environment variables:

- `Project URL`: Found in "API Settings" as "Project URL"

- `Anon key`: Found in "Project API keys" as "anon public"

- `Service role key`: Found in "Project API keys" as "service_role" (Reminder: Treat this like a password!)

#### 3. Configure Auth

Next, click on the "Authentication" icon tab on the far left.

In the text tabs, click on "Providers" and make sure "Email" is enabled.

We recommend turning off "Confirm email" for your own personal instance.

#### 4. Connect to Hosted DB

Open up your repository for your hosted instance of ChatLabs.

In the 1st migration file `supabase/migrations/20240108234540_setup.sql` you will need to replace 2 values with the values you got above:

- `project_url` (line 53): Use the `Project URL` value from above
- `service_role_key` (line 54): Use the `Service role key` value from above

Now, open a terminal in the root directory of your local ChatLabs repository. We will execute a few commands here.

Login to Supabase by running:

```bash
supabase login
```

Next, link your project by running the following command with the "Project ID" you got above:

```bash
supabase link --project-ref <project-id>
```

Your project should now be linked.

Finally, push your database to Supabase by running:

```bash
supabase db push
```

Your hosted database should now be set up!

### 3. Setup Frontend with Vercel

Go to [Vercel](https://vercel.com/) and create a new project.

In the setup page, import your GitHub repository for your hosted instance of ChatLabs. Within the project Settings, in the "Build & Development Settings" section, switch Framework Preset to "Next.js".

In environment variables, add the following from the values you got above:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_OLLAMA_URL` (only needed when using local Ollama models; default: `http://localhost:11434`)

You can also add API keys as environment variables.

- `OPENAI_API_KEY`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_GPT_45_VISION_NAME`

For the full list of environment variables, refer to the '.env.local.example' file. If the environment variables are set for API keys, it will disable the input in the user settings.

Click "Deploy" and wait for your frontend to deploy.

Once deployed, you should be able to use your hosted instance of ChatLabs via the URL Vercel gives you.

## Platform Tools

We've introduced a new feature that allows every user to access a set of platform tools directly within the application. These tools are designed to enhance your productivity and streamline your workflow. Here's a quick overview of the tools currently available:

* **Web Scraper Tool**:  This tool fetches data from a URL and returns it in markdown format to the LLM. It's perfect for quickly grabbing content from web pages without having to manually copy and paste or write markdown. It also supports google fetching results from google search and summarizing youtube videos. 

* **Image Generation Tool**:  This tool generates AI images with Dall-E. 

For adding or removing platform tools, consult the [platformToolsList.ts](./lib/platformTools/platformToolsList.ts) document.

To introduce a new tool, utilize the `PlatformTool` interface and incorporate it into the aforementioned list. For a practical illustration, examine the [webScraperTool.ts](./lib/platformTools/library/webScraperTool.ts) example.

## Contact

Message Artem on [Twitter/X](https://twitter.com/avysotsky)
