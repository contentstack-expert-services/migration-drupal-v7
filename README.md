# Content migration from Drupal

This project (export script) allows you to export content from Drupal using MySQL queries and makes it possible to import it into Contentstack. Using this project, you can easily export Drupal Content types ( Article, Page, Custom content types) Vocabularies, into Contentstack.

## Installation

Clone/Download this project and run the command given below in a terminal:

```bash
npm install
```

This command will install the required node files on your system.

## Configuration

Before exporting the data, you need to add the following configuration settings in the 'config' file within the 'config' folder of the project:

```bash
    "host":"<<mysql host>>",
    "user":"<<mysql username>>",
    "password":"<<mysql password>>",
    "database":"<<mysql database of drupal>>",
```

For example:

```bash
    "mysql":{
        "host":"localhost",
        "user":"root",
        "password":"",
        "database":"workshop"
    }
```

## Assets & Images

Your files and assets need to be available and accessible through the internet. For this purpose, you must define the drupal_base_url, and public and private file paths in the config file so that the exporter can create them.

```bash
    base_url: http://example_hostname.com,
    public_path: <<public file path>>,
    private_path: <<private file path>>,
    drupal_base_url: <<mysql database name>> // here add database name
```

For example:

```bash
    "base_url": "http://localhost/",
    "public_path": "/sites/default/files/",
    "private_path": "",
    "drupal_base_url": "drupal"
```

## Content Types

To be able to correctly map the Drupal content types to the Contentstack content types they must be identified by name.

## Export all modules

Run the command given below to export all the modules:

```bash
 npm run export
```

## Create a new stack in your organization in contentstack.

You have to create a new stack in your Contentstack organization. This stack will be used to migrate the data from Drupal to Contentstack.

---

# Importing Data using Contentstack CLI

Ways to import data into Contentstack include:

**Step 1:** Install the [Contentstack CLI ](https://www.npmjs.com/package/@contentstack/cli)by running this command on the terminal

    `npm i -g @contentstack/cli`

    For the Mac users, if found trouble: “`sudo npm i -g @contentstack/cli`”

Step 2: [The user must specify the region where their stack is after the cli has been successfully installed.](https://www.contentstack.com/docs/developers/cli/configure-regions-in-the-cli)

`csdx config:set:region <`

- In place of <`<region>`>, we have to replace it with our region code.
- EU for Europe

- AZURE-NA for Azure North America
- AZURE-EU for Azure Europe

- NA for North America
- GCP-NA for GCP North America

If the user stack is in North America, they must write as follows:

`csdx config:set:region NA`

**Step 3:** [After choosing the region, the user must run this command to log into the cli.](https://www.contentstack.com/docs/developers/cli/cli-authentication)

csdx auth:login

**Step 4:** We have successfully set the region and logged into the Contentstack by performing the steps mentioned above.

**Step 5:** This is optional for the stack owner/admin. You can import using a management token or directly using the stack API key; **skip to step 20**.

**Step 6:** Creating a management token for non-admin users: The steps

**Step 7:** Open the [Contentstack-Website](https://www.contentstack.com/login)

**Step 8:** Choose the organization.

**Step 9:** Decide which stack you want to use for import.

**Step 10:** Go to the settings.

**Step 11:** Select tokens option

**Step 12:** Go to the Management Tokens tab and click on the +Management Tokens button

**Step 13:** Enter the required field data and permit to Write

**Step 14:** Choose the token's expiration date as **Never** or any other duration you prefer.

**Step 15:** Click on Generate Tokens.

**Step 16:** Save the created management token because the cli will use it to import the data.

**Step 17:** Now open the terminal and execute this command to save the management token,
`csdx auth:tokens:add`

**Step 18:** Select the Add Management Tokens option from the given options.

1. Add the name of the management token
2. Add the API Key of the stack that you want to export
3. Add the management token created when the user created the management token from the website.

**Step 19:** [Now that the management token has been added to the new or existing stack, we must run the import script. ](https://www.contentstack.com/docs/developers/cli/import-content-using-the-cli#import-content-using-management-token-and-parameters)

`csdx cm:stacks:import -a <<alias>> -d <<file_path>>`

1. Here <`<alias>`> is a name that you have entered in the management token, and `<<file_path>>` will be the path where your data is saved.

**Step 20:**[ If you are the owner or admin of stack, you can import using the stack API key as well](https://www.contentstack.com/docs/developers/cli/import-content-using-the-cli#import-content-using-auth-token-and-parameters)

`csdx cm:stacks:import -k <<stack_api_key>> -d <<file_path>>`

1. Here `<<stack_api_key>>` is a stack API key, which you can find in the stack settings, and `<<file_path>>` will be the path where your data is saved.

**Step 21:** This successfully migrated the import data into a new or existing stack.
