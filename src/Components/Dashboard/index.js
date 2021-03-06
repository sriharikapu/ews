import React, { Component } from 'react';
import web3 from "../web3.js";
import ipfs from "../ipfs.js";
import storehash from "../storeHash.js";
class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = { ipfsHash:null,
            buffer:'',
            ethAddress:'',
            blockNumber:'',
            transactionHash:'',
            gasUsed:'',
            txReceipt: '',
            account:'',
            size:-1,
            showResults:false,
            message:''
        }
    }
    captureFile =(event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)    
      };
    convertToBuffer = async(reader) => {
      //file is converted to a buffer for upload to IPFS
        const buffer = await Buffer.from(reader.result);
      //set this buffer -using es6 syntax
        this.setState({buffer});
    };
    onSubmit = async (event) => {
        event.preventDefault();
       //bring in user's metamask account address
        const accounts = this.state.account;
        var message = 'Sending from Metamask account: ' +this.state.account
        this.setState({showResults:true});
        this.setState({message})
      //obtain contract address from storehash.js
        // const ethAddress= await storehash.options.address;
        // this.setState({ethAddress});
      //save document to IPFS,return its hash#, and set hash# to state
      //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 
        await ipfs.add(this.state.buffer, (err, ipfsHash) => {
          console.log(err,ipfsHash);
          //setState by setting ipfsHash to ipfsHash[0].hash 
          this.setState({ ipfsHash:ipfsHash[0].hash,size:ipfsHash[0].size});
     // call Ethereum contract method "sendHash" and .send IPFS hash to etheruem contract 
    //return the transaction hash from the ethereum contract
    //see, this https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send
          
          storehash.methods.addHash(this.state.ipfsHash,this.state.account,this.state.size).send({
              from:this.state.account
          }, (error, transactionHash) => {
            console.log(transactionHash);
            this.setState({transactionHash});
            this.setState({showResults:false});
          }); //storehash 
        }) //await ipfs.add 
      }; //onSubmit
      //to render
      componentDidMount(){
        var that = this;
        web3.eth.getAccounts(function(error,result) {
            that.setState({account: result[0]})
        });
      }
      privateFormSubmit(){
        var formData = new FormData();
        var imagefile = document.querySelector('#file2');
        formData.append("image", imagefile.files[0]);
        console.log("hello");
        fetch("http://172.16.27.88:8001/ews/ewsupload/", {
            method: 'POST', // or 'PUT'
            body: formData, // data can be `string` or {object}!
            headers:{
                'Content-Type': 'multipart/form-data'
            }
          }).then(res => res.json())
    }
    render() { 
        const uploadedMessage = (
            <div style={{marginTop:'4em'}}>
                <strong style={{textAlign:'center',marginTop: '2em'}}><b>Your Last Uploaded IPFS file hash: </b>{this.state.ipfsHash}</strong>
                    <br/>
                <strong style={{textAlign:'center',marginTop: '2em'}}><b>Your Last TxReceipt: </b>{this.state.transactionHash}</strong>
            </div>            
        )
        const message = ( 
            this.state.ipfsHash ? uploadedMessage : null
        )
        var spinner;
        if(this.state.showResults){
            spinner=  <div className="preloader-wrapper big active">
            <div className="spinner-layer spinner-red">
                 <div className="circle-clipper left">
                 <div className="circle"></div>
                 </div><div className="gap-patch">
                 <div className="circle"></div>
                 </div><div className="circle-clipper right">
                 <div className="circle"></div>
                 </div>
             </div>
         </div>
        }
        else spinner=<div></div>
        return ( 
            <div className="container" style={{marginTop:'1em'}}>
                Dashboard account id = {this.state.account}
                <h3> Choose file to send to IPFS </h3>
                <form onSubmit={this.onSubmit}>
                    <input 
                    type = "file"
                    onChange = {this.captureFile}
                    />
                    <button className="waves-effect waves-light btn" type="submit"> 
                    Send it<i className="material-icons right">send</i> 
                    </button>
                </form>
                <div>
                    {message}
                </div>
               {spinner}
                <div style={{border: '1px solid red', marginTop: '6em', padding:'2em'}}>
                    <h4> Choose confidential(private) files to upload.</h4>
                    <form encType='multipart/form-data' action='http://172.16.27.88:8001/ews/ewsupload/' method='post'>
                        <input 
                        type = "file"
                        name = "file"
                        id="file2"
                        accept=".txt"
                        />
                        <button className="waves-effect waves-light btn" type="submit"> 
                        Send it<i className="material-icons right">send</i> 
                        </button>
                    </form>
                </div>
            </div>
        );
    }
}


export default Dashboard;
