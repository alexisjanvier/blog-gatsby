.PHONY: help install start

help: ## Display available commands
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install project dependencies
	yarn install

start: ## start dev server
	yarn develop

build: ## Build files for production
	yarn build

deploy: build ## Deploy static site on surge
	surge -p public/ -d ajnet-blog-v2.surge.sh
