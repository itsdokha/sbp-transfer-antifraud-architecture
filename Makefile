# Пересборка картинок из исходников схем.
# C4: PlantUML в Docker (в образе есть Graphviz и стандартная библиотека C4-PlantUML).
# BPMN: bpmn-js в headless Chrome (нужен Node.js 18+).

BPMN = diagrams/bpmn/sbp-antifraud-process
BPMN_TITLE = BPMN: Т-Банк — антифрод-решение по исходящему переводу СБП

.PHONY: all c4 bpmn

all: c4 bpmn

c4:
	docker run --rm -u $$(id -u):$$(id -g) -v $(CURDIR)/diagrams/c4:/data plantuml/plantuml -tpng -charset UTF-8 /data/*.puml
	docker run --rm -u $$(id -u):$$(id -g) -v $(CURDIR)/diagrams/c4:/data plantuml/plantuml -tsvg -charset UTF-8 /data/*.puml

tools/node_modules:
	cd tools && npm install

bpmn: tools/node_modules
	node tools/render_bpmn.js $(BPMN).bpmn $(BPMN).svg $(BPMN).png "$(BPMN_TITLE)"
