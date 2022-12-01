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
    private_path: <<private file path>>
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

You have to create a new stack in your Contentstack organization. This stack will be used for migrating the data from Drupal to Contentstack.

## Import content

After that run the [csmig](https://www.npmjs.com/package/csmig) script to import the content to Contentstack. (Node version must be v16+ to use this package)

## Steps to install csmig

1. Install the csmig package globally by running the following command:

   ```bash
   npm i -g csmig
   ```

## How to use csmig package

1. After installing the csmig package run the following command:

   ```bash
   csmig run
   ```

2. Select your organization region.
   for example: North America (NA)
3. After selecting the region enter your Contentstack credentials to login.
4. After logging in, select Contentstack from the available options.
5. After selecting Contentstack, on the next steps select Import from local.
6. Copy the 'drupalMigrationData' folder path from your project directory.
   for example: /home/admin/drupalMigrationData
7. You will get a prompt on whether to import on a new stack or an existing one, please type 'n' and continue.
8. Select your organization from your provided organization list.
9. Here, you will see the stack that you have created earlier. Please select the particular stack which you have created.
10. After performing all the above steps your migration from Drupal to Contentstack will begin.

## Log

You can find the logs of the export process under libs/utils/logs. The files included are 'success' and 'error'. Successfully run processes are recorded under 'success' and the errors under 'errors'.

## Known issues

1. Only supported for Drupal 7 versions.
2. For the title of the Link field, we have used the same URL value as the title in Contentstack.

## License

This project is covered under the MIT license.
