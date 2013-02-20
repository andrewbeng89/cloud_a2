# Andrew's Big Data Cloud Computing Problem

The data I have chosen for this assignment is taken from the [2009 GitHub Contest](https://github.com/blog/466-the-2009-github-contest). The dataset for this competition included the following data files in text format:

## data.txt ##

This is the main dataset.  Each line is of the format <user_id>:<repo_id>
which represents a user watching a repository.  There are 440,237 records
in this file, each a single user id and a single repository id seperated
by a colon.  The data looks something like this (information from contest readme):

	43642:123344
	742:22132
	5414:2373
	8660:1160
	10218:409
	301:6979

## repos.txt ##

This file lists out the 120,867 repositories that are used in the data.txt
set, providing the repository name, date it was created and (if applicable)
the repository id that it was forked off of.  The data looks like this:

	123335:seivan/portfolio_python,2009-02-18
	123336:sikanrong/Nautilus-OGL,2009-05-19
	123337:edlebowitz/Downloads,2009-05-05
	123338:DylanFM/roro-faces,2009-05-31,13635
	123339:amazingsyco/technicolor-networking,2008-11-22
	123340:netzpirat/radiant-scoped-admin-extension,2009-02-27,53611
	123341:panchenliang/tuxedo-bank-server,2009-05-19

## lang.txt ##

The last dataset included is the language breakdown data.  This lists the
languages we could identify in each repository - only 73,496 repositories
have language data that we have calculated, but it is data available to us
so if you want to use it for classifications or something, feel free. Each
line of this file lists the repository id, then a comma delimited list of 
"<lang>;<lines>" entries containing each major language found and the number
of lines of code for that language in the project.  The data looks like this:

	57493:C;29382
	73920:JavaScript;9759,ActionScript;12781
	106774:Perl;4449
	123201:JavaScript;148,Ruby;16079
	65707:Ruby;29998
	98561:JavaScript;217,Ruby;4800900

## The Problem ##

The problems I have designed for this assignment are as follows:

* Which programming language can be found across the most number of repositories?
* How many repositories does this language appear in?
* Based on the data provided, which GitHub repository is the most watched by fellow GitHubbers?
* How many watchers are following this repository?
* What is the primary programming language used in this repository?

## The BigData Tutorial ##

### Cloud Platform

The public cloud platform that you will be using for this tutorial is [Amazon EC2](http://aws.amazon.com/ec2/) on a single Ubuntu Server instance. Once your EC2 instance has been provisioned and is running, follow these steps:

1. Install node.js on the EC2 instance by following the steps [here](http://iconof.com/blog/how-to-install-setup-node-js-on-amazon-aws-ec2-complete-guide/)
2. Install mongodb NoSQL database system via the command line:
	
	``npm install mongodb -g``

3. Install git on via the command line:

	``sudo apt-get install git``

4. Setup an account and new database on [MongoLab](https://mongolab.com), and note shell and URI connection parameters
5. From the command line of the EC2 instance, clone this project:

	``git clone git://github.com/andrewbeng89/cloud_a2.git``
	
6. cd to the cloud_a2 project root folder

---------------------------------------

### Data Preparation

I have converted the data.txt and repos.txt files (located in the data directory in this project) to .csv files by finding and replacing all colons with commas and added appropriate first row headers. The conversion to .csv will facilitate the import of the data into the newly created MongoLab database. The data for data.csv now looks like this:

	user_id,repo_id
	1,1
	2,2
	3,3
	
While the data for repos.csv now looks like this:

	repo_id,repo_name,date_created,forked_from
	1,richardc/perl-number-compare,2009-02-26
	2,axiomsoftware/axiom-inspector,2009-05-09
	3,rails/open_id_authentication,2008-05-29
	
The lang.txt file will converted to lang.json as each repository possible has multiple languages. The conversion to json file will be invoked via a node.js module form the command line:

	node load_lang.js

The single row from lang.txt below will correspond to the JSON object beneath it:

	8213:Ruby;395056,JavaScript;802
	
```js
{
    "repo_id": "8213",
    "langs": [
        {
            "_id": {
                "$oid": "51243dc0b2f3c8081f000002"
            },
            "lang": "Ruby",
            "lines": "395056"
        },
        {
            "_id": {
                "$oid": "51243dc0b2f3c8081f000001"
            },
            "lang": "JavaScript",
            "lines": "802"
        }
    ]
}
```

---------------------------------------

### Loading Data into MongoLab

Now that data.csv, repos.csv and lang.json are prepared, it is time to upload the data to MongoLab Mongo-as-a-Service! I have prepared the mongoinsert_lang_data, mongoinsert_repo_data and mongoinsert_watch_data bash script files to facilitate the batch uploads to MongoLab. However the host, database, user and password parameters will have to be changed to match those from the database you created earlier. For mongoinsert_lang_data, update the parameters accordingly:

	mongoimport -h <host_of_created_database> -d <name_of_created_database> -u <user> -p <password> -c langmodels --type json --file ./data/lang.json --jsonArray
	
Once the mongodb parameters have been updated for all three bash scripts, upload the data to MongoLab by executing the scripts in the EC2 command line:

	./mongoinsert_lang_data
	./mongoinsert_repo_data
	./mongoinsert_watch_data
	
Refreshing the MongoLab admin console for the database will show that three new collections have been made:

* repomodels: The collection of repository metadata objects corresponding to repos.txt
* langmodels: The collection of repository-languages objects corresponding to lang.txt
* watchmodels: The collection of user_id - repo_id objects of users watching repositories corresponding to data.txt

---------------------------------------

### MapReduce with node.js and mongoosejs

In order to solve the problems stated earlier, I have created a node.js module that will perform MapReduce on the database collections using the mongoosejs mongodb driver for node. The mongoose database connection parameters in map_reduce.js would have to be updated to those for your database:

	mongoose.connect('mongodb://<user>:<password>@<host_of_created_database>/<name_of_created_database>');
	
Once this has been updated, via the EC2 command line, execute the module:

	node map_reduce.js
	
The result of the operation will be in this format:

	Find the programming language that is found 
	across the most number of repositories:
	map reduce took XXXX ms
	language: XXXXXX, num_repos: XXXXX

	Find the repo with the most number of wathcers:
	map reduce took XXXXX ms
	most number of watchers per repo: XXXX
	repo_id: XXXXX, repo_name: XXXXXXXXXXXXX
	primary programming language of repo: XXXXX
	
