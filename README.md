[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)


<img src="assets/chorus-logo.png" alt="Chorus Logo" title="Chorus: Towards an open stack for ecommerce search" width="200" align="right"/>

Chorus
==========================

*Towards an open source tool stack for e-commerce search*

**This is a fork of [chorus-elasticsearch-edition](https://github.com/querqy/chorus-elasticsearch-edition). Refer to that repository for more information on Chorus.**

Chorus makes deploying powerful ecommerce search easier by shifting the **buy vs build** decision in favour of **build**, so you can own your search! Chorus deals with three issues:

1. **Starting from Scratch is Time Consuming** Downloading an open source search engine isn't enough. It's like being provided with all the parts of a Lego model, but without building instructions ;-) .  We need a better baseline to quickly get started.

2. **Integration of Tooling is Hard** Search isn't just a query running on an index of data. It's also the operational monitoring, the analytics and relevance tooling, that goes into it.  Every team that starts, faces the penalties of starting from scratch, integrating an ecosystem of options.

3. ***Sharing Knowledge is a Must!*** It isn't enough to just have conference talks. We need code and data samples in order to share knowledge about improving ecommerce search. Chorus is a public environment that you can use to profit from the community and also to share your next great idea!

This is the project that enables Chorus to use OpenSearch as the search engine. For others:
* You can visit the [Solr version of Chorus](https://github.com/querqy/chorus)
* You can visit the [Elasticsearch version of Chorus](https://github.com/querqy/chorus-elasticsearch-edition)

Want to stay up-to-date with the community? Visit https://querqy.org/ to learn more, and join the [E-Commerce Search Slack](https://ecom-search.slack.com/) group for tips, tricks, help and news on what's new in the Chorus ecosystem.

# What Runs Where

* The UI (Reactivesearch) runs at http://localhost:3000 |  http://chorus-opensearch-edition.dev.o19s.com:3000
* The UI (Chorus UI) runs at http://localhost:3001 |  http://chorus-opensearch-edition.dev.o19s.com:3001
* OpenSearch runs at http://localhost:9200 |  http://chorus-opensearch-edition.dev.o19s.com:9200
* OpenSearch Dashboards runs at http://localhost:5601/app/home |  http://chorus-opensearch-edition.dev.o19s.com:5601/app/home
* OpenSearch Data Prepper runs at http://localhost:2021/ |  http://chorus-opensearch-edition.dev.o19s.com:2021/
* Quepid runs at http://localhost:4000  |  http://chorus-opensearch-edition.dev.o19s.com:4000

Working with macOS? Pop open all the tuning related web pages with one terminal command:
> open http://localhost:4000 http://localhost:5601/app/home http://localhost:3000

# 5 Minutes to Run Chorus!

We are trying to strike a balance between making the setup process as easy and fool proof as possible, with the need to not _hide_ too much of the interactions between the projects that make up Chorus.

If you are impatient, we provide a quick start script, `./quickstart.sh` that sets Chorus up for you. However, I recommend you go through [Kata 0: Setting up Chorus](katas/000_setting_up_chorus.md), to get a picture of what's running in the stack.

After setting up Chorus you can check out [Kata 1: Alice Needs a New Laptop](katas/001_alice_needs_a_new_laptop.md) to learn about getting some insight into your user's behavior!

[More Katas can be found in the Solr version of Chorus](https://github.com/querqy/chorus#structured-learning-using-chorus) and many can be transferred to this OpenSearch based stack. Some are also covered in a video series called [Meet Pete](https://opensourceconnections.com/blog/2020/07/07/meet-pete-the-e-commerce-search-product-manager/). Feel free to open PRs to add Katas you find useful or open issues if you want to see specific Katas included. Every contribution is welcome! 

# Structured Learning using Chorus OpenSearch Edition
Learn more by following this sequence of Katas:

1. 000 Kata: [Setting up Chorus](katas/000_setting_up_chorus.md)
1. First Kata: [Alice Needs a New Laptop](katas/001_alice_needs_a_new_laptop.md)
1. Second Kata: [Deriving Interaction Data](katas/002_derive_interaction_data.md)
1. Third Kata: [Importing Pre-Existing Event Data](katas/003_import_preexisting_event_data.md)
1. Fourth Kata: [Build a Basic Dashboard](katas/004_build_a_basic_dashboard.md)
1. Fifth Kata: [Hybrid Search in OpenSearch](katas/005_1_run_a_hybrid_search.md)
1. Sixth Kata: [Protecting Sensitive Information while using UBI](katas/006_protecting_sensitive_information.md)

# Useful Commands for Chorus

To start your environment, but still run each command to set up the integrations manually, run:

```
docker compose up --build -d
```

The quickstart script will launch OpenSearch, download and index the sample product data for the _ecommerce_ index:

```
./quickstart.sh
```

If you want to add in the offline lab environment based on Quepid, then tack on the `--with-offline-lab` parameter:

```
./quickstart.sh --with-offline-lab
```

To see what is happening in the Chorus stack you can tail the logs for all the components via:

```
docker compose logs -tf
```

If you want to see the logs of just one component of the Chorus stack, use:

```
docker compose ps                       # list out the names of the components
docker compose logs -tf opensearch      # tail opensearch only
```

To stop all containers, you can run:

```
./quickstart.sh --stop
```

To destroy your environment (including any volumes created, like the mysql DBs), just run:

```
docker compose down -v
```

or:

```
./quickstart.sh --shutdown
```

If Docker is giving you a hard time, then some options are:

```
docker system prune                     # removes orphaned images, networks, etc.
docker system prune -a --volumes        # removes all images, clears out your Docker diskspace if you full.
```

You may also have to [increase the resources](./assets/increase_docker_resources.gif) given to Docker - up to 4 GB RAM and 2 GB Swap space.

# Chorus Data Details

The Chorus project includes some public, sample datasets. These datasets enable the community to learn, experiment and collaborate in a safe manner and are a key part of demonstrating, how to build measurable and tunable ecommerce search, with open source components.

The sample product data is generously sourced from [Icecat](https://icecat.biz/) and is licensed under their [Open Content License](https://iceclog.com/open-content-license-opl/).

The version of the Icecat product data that Chorus [provides](https://querqy.org/datasets/icecat/icecat-products-w_price-19k-20201127.tar.gz) has the following changes:
* Data converted to JSON format.
* Products that don't have a 500x500 pixel image listed are removed.
* The Prices of ~19,000 products got extracted from the https://www.upcitemdb.com/ service, using EAN codes.

# Tips for installing on Windows
* Ensure that docker desktop is running
* install in a linux WSL. 
* You might need to `apt-get install ` jq, wget & dos2unix
* if you have \r issues with running `source quickstart.sh`:
  * `dos2unix *.sh`
  * `dos2unix opensearch/*.sh`
* if your subsystem is blocked from outside ports:
  * the easiest solution is to manually download and unpack https://querqy.org/datasets/icecat/icecat-products-w_price-19k-20201127.tar.gz in the project root.  Then run `source quickstart.sh` to index the data
  * or just figure out how to open the subsystem ports :)


# Known Issues

1. We have removed SMUI until Querqy is updated for recent OpenSearch versions.
1. We have removed the kata `001_optimize_a_query.md` until SMUI is back.
1. Waiting for OpenSearch 2.18 and UBI 2.18 with the fix for _msearch and pipelines.

Of course, contributions are very welcome to improve Chorus - The OpenSearch Edition!
