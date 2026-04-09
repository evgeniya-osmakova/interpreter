.PHONY: check lean-build web-test web-build

check: lean-build web-test web-build

lean-build:
	cd lean && $(HOME)/.elan/bin/lake build

web-test:
	cd web && npm test

web-build:
	cd web && npm run build
