.PHONY: help install start

help: ## Display available commands
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install project dependencies
	npm install

start: ## start dev server
	npm run develop

build: ## Build files for production
	npm run build

deploy: build ## Deploy static site on surge
	surge -p public/ -d ajnet-blog-v2.surge.sh
