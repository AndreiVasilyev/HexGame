const SQRT3=Math.sqrt(3);
let gameLevel=0;
let cellSize=0;
let cells=[];
let gameFieldSize=0;
let serverUrl='';

window.onload=function(){ 
    initStartPage();
    if(gameLevel!=0) initGameField();
    
}

function initGameField(){     
    cells=[];
    serverUrl=document.getElementById('url-server').value+(Number(gameLevel)+1);    
    for(let i=-gameLevel;i<=gameLevel;i++){
        for(let j=-gameLevel;j<=gameLevel;j++){
            for(let k=-gameLevel;k<=gameLevel;k++){
                if(i+j+k===0){                   
                   cells.push(newCell(i,j,k)); 
                }
            }
        }
    }    
    calculateFieldSize();
    calculateCellSize();    
    setCSSVariableValues(); 
    updateCellValues();
    function newCell(i,j,k){
        return {x:i,y:j,z:k,value:0};
    }
    
}

function initStartPage(){
    let currentPathname=window.location.hash;    
    let currentGameLevel=document.querySelector('input[name="level"]:checked').value;   
    if(currentPathname.startsWith('#test')){
        gameLevel=Number(currentPathname.replace('#test',''))-1;        
        let radioBlockElement=document.querySelector('.radio-block');
        radioBlockElement.style.display='none';      
    } else if(currentGameLevel>=1) {
        gameLevel=currentGameLevel;        
    } else return;
    let gameStatusElement=document.querySelector("span[data-status]");
    gameStatusElement.innerHTML='playing';
    gameStatusElement.dataset.status='playing'; 
      
    
}



function calculateFieldSize(){
    let screenWidth=document.documentElement.clientWidth;
    let screenHeight=document.documentElement.clientHeight;    
    gameFieldSize=Math.round(0.7*Math.min(screenHeight,screenWidth));  
}

function calculateCellSize(){    
    cellSize=Math.floor(gameFieldSize/(SQRT3*(gameLevel*2+1))); 
}

function setCSSVariableValues(){
    let rootVariables=document.querySelector(':root');
    let rootStyles=getComputedStyle(rootVariables);
    let cellHeight=Math.round(SQRT3*cellSize);
    let yShift=Math.round(0.35*cellSize);
    let xShift=-(Math.round(0.5*cellSize)+1);    
    rootVariables.style.setProperty('--cell-size',cellSize+'px');
    rootVariables.style.setProperty('--cell-height',cellHeight+'px');
    rootVariables.style.setProperty('--x-shift',xShift+'px');
    rootVariables.style.setProperty('--y-shift',yShift+'px');
    rootVariables.style.setProperty('--field-size',gameFieldSize+'px');
}

function drawCellsField(){
    let oldFieldElement=document.querySelector('.game-field');
    if(oldFieldElement!=null) oldFieldElement.remove();
    let dxCenter=Math.round(gameFieldSize/2)-Math.round(cellSize/2);
    let dyCenter=Math.round(gameFieldSize/2)-Math.round(SQRT3*cellSize/2);     
    let divField=document.createElement('div');    
    divField.classList.add('game-field');
    for(let i=0;i<cells.length;i++){
        let divCell=createCellElement(cells[i],dxCenter,dyCenter);
        divField.appendChild(divCell);         
    }    
    document.querySelector('.option-block').after(divField);
    drawCellValue();
}

function createCellElement(cell,dxCenter,dyCenter){   
    let dx=cell.x*1.5*cellSize;    
    let dy=Math.round(SQRT3*cellSize*0.5*(+cell.z-cell.y));    
    let divCell=document.createElement('div');    
    divCell.classList.add('cell');
    dx=dxCenter+dx;
    dy=dyCenter+dy;    
    divCell.style.top=dy+'px';
    divCell.style.left=dx+'px';
    divCell.setAttribute('data-x',cell.x);
    divCell.setAttribute('data-y', cell.y);
    divCell.setAttribute('data-z',cell.z);
    divCell.setAttribute('data-value',cell.value);
    if(cell.value!=0){
        let spanText=document.createElement('span');
        spanText.classList.add('cell-value');
        spanText.innerHTML=cell.value;    
        divCell.appendChild(spanText);
    }       
    return divCell;
}

function drawCellValue(){
    let cellValueElements=document.querySelectorAll(".cell-value");
    for(element of cellValueElements){
        let computedStyles=getComputedStyle(element);
        let width=Number(computedStyles.width.replace('px',''));
        let height=Number(computedStyles.height.replace('px',''));             
        element.style.top=Math.round(cellSize*SQRT3/2)-Math.round(height/2)+'px';
        element.style.left=Math.round(cellSize/2)-Math.round(width/2)+'px';
    }   
}

function updateCellValues(){
    let filledCells=getFilledCells();
    getDataFromServer(filledCells);
}

function getFilledCells(){
    let result=[];
    for(cell of cells){
        if(cell.value!=0) result.push(cell);
    }    
    return result;
}

function getDataFromServer(data) {
	$.ajax({
		type : "POST",
		contentType : "application/json",
		url : serverUrl,
		data : JSON.stringify(data),
		dataType : 'json',
		timeout : 100000,
		success : function(data) {
			console.log("SUCCESS: ", data);	
            showCellValues(data);
            addOptionListeners();
            addMoveKeyListeners();            
		},
		error : function(e) {
			console.log("ERROR: ", e);
		},
		done : function(e) {
			console.log("DONE");
		}
	});
}

function showCellValues(data){
    for(newCell of data){        
        for(cell of cells){            
            if(newCell.x==cell.x&&newCell.y==cell.y&&newCell.z==cell.z){
                cell.value=newCell.value;
                break;
            }
        }        
    }
    let emptyCellCounter=0;
    for(cell of cells){
        if(cell.value==0) emptyCellCounter++;
    }
    drawCellsField();
    if (emptyCellCounter==0) checkForAvailabilityMoves();
        
}

function addOptionListeners(){
    document.getElementById('url-server').onchange=function(){
            initStartPage();            
            if(gameLevel!=0) initGameField();               
    }
    let radioBlockElement=document.querySelector('.radio-block');
    if(radioBlockElement.style.display!='none'){
        let radioButtonElements=document.querySelectorAll('input[name="level"]'); 
        for(radioElement of radioButtonElements){
            radioElement.onchange=function(event){
                let currentGameLevel=event.currentTarget.value;
                gameLevel=currentGameLevel;
                initGameField();                
            }
        }
    }
}

function addMoveKeyListeners(){
    document.onkeyup=function(event){
        switch(event.code){
            case 'KeyQ':                 
                handleMoveQ();
                break;
            case 'KeyW': 
                handleMoveW();
                break;
            case 'KeyE': 
                handleMoveE();
                break;
            case 'KeyA':
                handleMoveA();
                break;
            case 'KeyS': 
                handleMoveS();
                break;
            case 'KeyD': 
                handleMoveD();
                break;
        }        
    }
}


function handleMoveQ(){
    let isMovesExist=false;
    for(cell of cells){
        if(cell.x==-gameLevel || cell.y==gameLevel){           
            let emptyCell=null;  
            let currentCell=cell;
            let nextCell=findCell(currentCell.x+1,currentCell.y-1,currentCell.z,cells);
            while(currentCell!=null){
                if(currentCell.value==0) {
                    if(emptyCell==null) emptyCell=currentCell;                   
                } else {
                    let cellPointer=nextCell;
                    while(cellPointer!=null){
                        if(cellPointer.value!=0){
                            if(cellPointer.value==currentCell.value){
                            currentCell.value*=2;
                            cellPointer.value=0;
                            isMovesExist=true;
                            }
                            cellPointer=null;
                            break;
                        }
                        cellPointer=findCell(cellPointer.x+1,cellPointer.y-1,cellPointer.z,cells);
                    }   
                    if(emptyCell!=null){
                        emptyCell.value=currentCell.value;
                        currentCell.value=0;  
                        isMovesExist=true;
                        while(emptyCell.value!=0||emptyCell.x!=currentCell.x||emptyCell.y!=currentCell.y){
                            emptyCell=findCell(emptyCell.x+1,emptyCell.y-1,currentCell.z,cells);
                        }
                    if(emptyCell.value!=0)emptyCell=null;
                    }                        
                } 
                currentCell=nextCell;
                if(nextCell!=null) nextCell=findCell(currentCell.x+1,currentCell.y-1,currentCell.z,cells);
            }              
        }
    }   
    if(isMovesExist) updateCellValues();
}

function handleMoveD(){
    let isMovesExist=false;
    for(cell of cells){
        if(cell.y==-gameLevel || cell.x==gameLevel){   
            let emptyCell=null;  
            let currentCell=cell;
            let nextCell=findCell(currentCell.x-1,currentCell.y+1,currentCell.z,cells);
            while(currentCell!=null){
                if(currentCell.value==0) {
                    if(emptyCell==null) emptyCell=currentCell;                   
                } else {
                    let cellPointer=nextCell;
                    while(cellPointer!=null){
                        if(cellPointer.value!=0){
                            if(cellPointer.value==currentCell.value){
                            currentCell.value*=2;
                            cellPointer.value=0;
                            isMovesExist=true;
                            }
                            cellPointer=null;
                            break;
                        }
                        cellPointer=findCell(cellPointer.x-1,cellPointer.y+1,cellPointer.z,cells);
                    }   
                    if(emptyCell!=null){
                        emptyCell.value=currentCell.value;
                        currentCell.value=0;
                        isMovesExist=true;
                        while(emptyCell.value!=0||emptyCell.x!=currentCell.x||emptyCell.y!=currentCell.y){
                            emptyCell=findCell(emptyCell.x-1,emptyCell.y+1,currentCell.z,cells);
                        }
                    if(emptyCell.value!=0)emptyCell=null;
                    }                        
                } 
                currentCell=nextCell;
                if(nextCell!=null) nextCell=findCell(currentCell.x-1,currentCell.y+1,currentCell.z,cells);
            }              
        }
    }  
    if(isMovesExist) updateCellValues();
}

function handleMoveE(){
    let isMovesExist=false;
    for(cell of cells){
        if(cell.z==-gameLevel || cell.x==gameLevel){   
            let emptyCell=null;  
            let currentCell=cell;
            let nextCell=findCell(currentCell.x-1,currentCell.y,currentCell.z+1,cells);
            while(currentCell!=null){
                if(currentCell.value==0) {
                    if(emptyCell==null) emptyCell=currentCell;                   
                } else {
                    let cellPointer=nextCell;
                    while(cellPointer!=null){
                        if(cellPointer.value!=0){
                            if(cellPointer.value==currentCell.value){
                            currentCell.value*=2;
                            cellPointer.value=0;
                            isMovesExist=true;
                            }
                            cellPointer=null;
                            break;
                        }
                        cellPointer=findCell(cellPointer.x-1,cellPointer.y,cellPointer.z+1,cells);
                    }   
                    if(emptyCell!=null){                       
                        emptyCell.value=currentCell.value;
                        currentCell.value=0;
                        isMovesExist=true;
                        while(emptyCell.value!=0||emptyCell.x!=currentCell.x||emptyCell.z!=currentCell.z){
                            emptyCell=findCell(emptyCell.x-1,currentCell.y,emptyCell.z+1,cells);
                        }
                    if(emptyCell.value!=0)emptyCell=null;
                    }                        
                } 
                currentCell=nextCell;
                if(nextCell!=null) nextCell=findCell(currentCell.x-1,currentCell.y,currentCell.z+1,cells);
            }              
        }
    }  
   if(isMovesExist) updateCellValues();
}

function handleMoveA(){
    let isMovesExist=false;
    for(cell of cells){
        if(cell.z==gameLevel || cell.x==-gameLevel){   
            let emptyCell=null;  
            let currentCell=cell;
            let nextCell=findCell(currentCell.x+1,currentCell.y,currentCell.z-1,cells);
            while(currentCell!=null){
                if(currentCell.value==0) {
                    if(emptyCell==null) emptyCell=currentCell;                   
                } else {
                    let cellPointer=nextCell;
                    while(cellPointer!=null){
                        if(cellPointer.value!=0){
                            if(cellPointer.value==currentCell.value){
                            currentCell.value*=2;
                            cellPointer.value=0;
                            isMovesExist=true;
                            }
                            cellPointer=null;
                            break;
                        }
                        cellPointer=findCell(cellPointer.x+1,cellPointer.y,cellPointer.z-1,cells);
                    }   
                    if(emptyCell!=null){
                        emptyCell.value=currentCell.value;
                        currentCell.value=0;
                        isMovesExist=true;
                        while(emptyCell.value!=0||emptyCell.x!=currentCell.x||emptyCell.z!=currentCell.z){
                            emptyCell=findCell(emptyCell.x+1,currentCell.y,emptyCell.z-1,cells);
                        }
                    if(emptyCell.value!=0)emptyCell=null;
                    }                        
                } 
                currentCell=nextCell;
                if(nextCell!=null) nextCell=findCell(currentCell.x+1,currentCell.y,currentCell.z-1,cells);
            }              
        }
    }  
    if(isMovesExist) updateCellValues();
}

function handleMoveW(){
    let isMovesExist=false;
    for(cell of cells){
        if(cell.z==-gameLevel || cell.y==gameLevel){   
            let emptyCell=null;  
            let currentCell=cell;
            let nextCell=findCell(currentCell.x,currentCell.y-1,currentCell.z+1,cells);
            while(currentCell!=null){
                if(currentCell.value==0) {
                    if(emptyCell==null) emptyCell=currentCell;                   
                } else {
                    let cellPointer=nextCell;
                    while(cellPointer!=null){
                        if(cellPointer.value!=0){
                            if(cellPointer.value==currentCell.value){
                            currentCell.value*=2;
                            cellPointer.value=0;
                            isMovesExist=true;
                            }
                            cellPointer=null;
                            break;
                        }
                        cellPointer=findCell(cellPointer.x,cellPointer.y-1,cellPointer.z+1,cells);
                    }   
                    if(emptyCell!=null){
                        emptyCell.value=currentCell.value;
                        currentCell.value=0;
                        isMovesExist=true;
                        while(emptyCell.value!=0||emptyCell.y!=currentCell.y||emptyCell.z!=currentCell.z){
                            emptyCell=findCell(currentCell.x,emptyCell.y-1,emptyCell.z+1,cells);
                        }
                    if(emptyCell.value!=0)emptyCell=null;
                    }                        
                } 
                currentCell=nextCell;
                if(nextCell!=null) nextCell=findCell(currentCell.x,currentCell.y-1,currentCell.z+1,cells);
            }              
        }
    }  
    if(isMovesExist) updateCellValues();
}

function handleMoveS(){
    let isMovesExist=false;
    for(cell of cells){
        if(cell.z==gameLevel || cell.y==-gameLevel){   
            let emptyCell=null;  
            let currentCell=cell;
            let nextCell=findCell(currentCell.x,currentCell.y+1,currentCell.z-1,cells);
            while(currentCell!=null){
                if(currentCell.value==0) {
                    if(emptyCell==null) emptyCell=currentCell;                   
                } else {
                    let cellPointer=nextCell;
                    while(cellPointer!=null){
                        if(cellPointer.value!=0){
                            if(cellPointer.value==currentCell.value){
                            currentCell.value*=2;
                            cellPointer.value=0;
                            isMovesExist=true;
                            }
                            cellPointer=null;
                            break;
                        }
                        cellPointer=findCell(cellPointer.x,cellPointer.y+1,cellPointer.z-1,cells);
                    }   
                    if(emptyCell!=null){
                        emptyCell.value=currentCell.value;
                        currentCell.value=0;
                        isMovesExist=true;
                        while(emptyCell.value!=0||emptyCell.y!=currentCell.y||emptyCell.z!=currentCell.z){
                            emptyCell=findCell(currentCell.x,emptyCell.y+1,emptyCell.z-1,cells);
                        }
                    if(emptyCell.value!=0)emptyCell=null;
                    }                        
                } 
                currentCell=nextCell;
                if(nextCell!=null) nextCell=findCell(currentCell.x,currentCell.y+1,currentCell.z-1,cells);
            }              
        }
    }  
   if(isMovesExist) updateCellValues();
}


function findCell(x,y,z,array){
    for(arrayElement of array){
            if(arrayElement.x==x&&arrayElement.y==y&&arrayElement.z==z) return arrayElement;
    }
    return null;
}     


let cellDirections = [
    {x:1,y:-1,z:0}, {x:1,y:0,z:-1}, {x:0,y:1,z:-1}, 
    {x:-1,y:1,z:0}, {x:-1,y:0,z:1}, {x:0,y:-1,z:1}
]
function checkForAvailabilityMoves(){
    for(cell of cells){        
        for(direction of cellDirections){   
            let dx=cell.x+direction.x;
            let dy=cell.y+direction.y;
            let dz=cell.z+direction.z;            
            let neighborCell=findCell(dx,dy,dz,cells);    
            if(neighborCell!=null && cell.value==neighborCell.value) return;              
        }
    }
   let gameStatusElement=document.querySelector("span[data-status]");
   gameStatusElement.innerHTML='game-over';
   gameStatusElement.dataset.status='game-over'; 
}