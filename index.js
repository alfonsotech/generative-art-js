const fs = require('fs');
const myArgs = process.argv.slice(2);
const { createCanvas, loadImage } = require('canvas');
const console = require('console');
const canvas = createCanvas(1000, 1000);
const ctx = canvas.getContext("2d");
const { layers, width, height } = require('./input/config.js');
const { resourceLimits } = require('worker_threads');
const editionSize = myArgs.length > 0 ? Number(myArgs[0]) : 1;
let metadataList = [];
let attributesList = [];
let dnaList = [];

const addMetadata = (_dna, _edition) => { 
    let dateTime = Date.now();
    let tempMetadata = { 
        dna: _dna,
        edition: _edition,
        date: dateTime,
        attributesList: attributesList,
       };
    metadataList.push(tempMetadata);
    attributesList = [];
    
    
};

const addAttributes = (_element) => {

    let selectedElement = _element.layer.selectedElement;
    attributesList.push({
        name: selectedElement.name,
        rarity: selectedElement.rarity,
    })

}

const loadLayerImg = async (_layer) => {
    return new Promise( async (resolve) => {
        let image = await loadImage(
            `${_layer.location}${_layer.selectedElement.fileName}`
            );
        resolve({layer: _layer, loadedImage: image});

    });
};

const drawElement = (_element) => { 
    ctx.drawImage(
        _element.loadedImage, 
        _element.layer.position.x, 
        _element.layer.position.y, 
        _element.layer.size.width, 
        _element.layer.size.height,
    );
    addAttributes(_element);
};


const constructLayerToDna = (_dna, _layers) => {
    let DnaSegment = _dna.toString().match(/.{1,2}/g);
    console.log('DnaSegment', DnaSegment);
    // let result = constructLayerToDna(newDna, layers);
    let mappedDnaToLayers = _layers.map( (layer) => {
        let selectedElement = layer.elements[parseInt(DnaSegment) % layer.elements.length];
        return {
            location: layer.location,
            position: layer.position,
            size: layer.size,
            selectedElement: selectedElement,
        }
    });
    return mappedDnaToLayers;
}

const createDna = (_length) => {
    let dna = {};
    let randomNum = Math.floor( Number(`1e${_length}`) + Math.random() * Number(`9e${_length}`) );
    return randomNum;
    
    // layers.forEach( (layer) => {
    //     dna[layer.id] = layer.elements[randomNum].id;
    // })  
}

const isDnaUnique = (_DnaList, _dna) => {
  let foundDna = _DnaList.find( (i) => i === _dna);
  return foundDna == undefined ? true : false;  
  
}

const saveImage = (_edition) => {
    fs.writeFileSync(`./output/${_edition}.png`, canvas.toBuffer('image/png'));
}

const signImage = (_sig) => {
    ctx.fillStyle = '#EE4B2B';
    ctx.font = 'bold 50px Arial';
    ctx.textBaseLine = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(_sig, 40, 40);

}

const writeMetadata = (_data) => {
    fs.writeFileSync(`./output/metadata.json`, _data);
}

const startCreating = async () => {
    writeMetadata('');
    let editionCounter = 1;

    while (editionCounter <= editionSize) {
        let newDna = createDna(layers.length * 2 - 1);
        console.log('DNA list', dnaList);
        
        if(isDnaUnique(dnaList, newDna)) {
            

            let results = constructLayerToDna(newDna, layers);
            let loadedElements = [];
            results.forEach( (layer) => {
                loadedElements.push(loadLayerImg(layer));
            });

            await Promise.all(loadedElements).then(elementsArray => {
                elementsArray.forEach( element => {
                    drawElement(element)
            });
            signImage(`#${editionCounter}`);
            saveImage(editionCounter);
            addMetadata(newDna, editionCounter);
            console.log(`created edition: ${editionCounter} with DNA:${newDna}`);
            });
            
            dnaList.push(newDna); 
            editionCounter++;  
          
        } else {
            console.log('Dna already exists');
        }
    }
    writeMetadata(JSON.stringify(metadataList));
};

startCreating();
