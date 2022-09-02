module.exports = {
  isExists : (arr,key,value)=>{
    return arr.some(el=>{
      return el[key] === value;  
    })
  }  
}