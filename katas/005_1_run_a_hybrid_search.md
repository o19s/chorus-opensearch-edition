# Kata 005: Hybrid search

We've noticed that our users of the Chorus Electonics website are truly terrible at spelling, for example this query: __Toner catrdge from leximark brand__ is returning laptop cases:

<img src="images/005_keyword.png" alt="Keyword Search" />

Notice that the first toner cartridge is in the third row, and it's an Epson brand!

This is a great use case for vectors, aka neural search.  They can really improve the matching, without the complexity of more traditional spellcheck type approaches, as you can see below:

<img src="images/005_hybrid_search.png" alt="Hybrid Search" />

To run this Kata, we're trying something new, we're going to use a Jupyter Notebook as there are a lot of commands to run to set up hybrid search in OpenSearch.

_WARNING_  This Kata requires Opensearch 2.18 with Multi-Search, which means we disabled UBI to make it work with a nightly build.

To get started you need to have a recent Python version.

1. Open a terminal and change to the katas directory: `cd ./katas`

1. We're going to use a "Virtual Environment" to organize everything: `python3 -m venv .venv`

1. Now start up the env: `source .venv/bin/activate`

1. Lastly, install all the required libraries: `pip install -r requirements.txt`

Or:

```
cd ./katas
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook 005_2_run_a_hybrid_search.ipynb
```



There are two ways to play with this.  

First, you can use notebook visualization tool Mercury to play with keyword and neural weightings and try out different queries.

Run `mercury run` and browse to http://127.0.0.1:8000/ to see the Hybrid notebook.  It will take 2 minutes to load as
reindexing the data with vector embeddings takes a while!

<img src="images/005_mercury_visualization.png" alt="Mercury Visualization" />

If you want to see all the commands for setting Hybrid search, then use the Jupyter notebook directory.

Run: `jupyter notebook 005_2_run_a_hybrid_search.ipynb`
