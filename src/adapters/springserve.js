var CONSTANTS = require('../constants.json');
var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');
var adloader = require('../adloader');

var SpringServeAdapter = function SpringServeAdapter() {

    function buildSpringServeCall(bid){

      var params = bid.params;
      //maps param attributes to request parameters
      var requestAttrMap = {
        sp: 'supplyPartnerId',
        w: 'width',
        h: 'height',
        imp_id: 'impId'
      };

      var spCall = "http://bidder.springserve.com/display/hbid?";

      for (var property in requestAttrMap){
        if(requestAttrMap.hasOwnProperty && params.hasOwnProperty(requestAttrMap[property])){
          spCall += '&';
          spCall += property;
          spCall += '=';
          //get property from params and include it in request
          spCall += params[requestAttrMap[property]];
        }
      }

      var domain = window.location.hostname;

      //override domain when testing
      if(params.hasOwnProperty("test") && params["test"] === true){
        domain = "test.com";
      }

      spCall += "&domain=";
      spCall += domain;
      spCall += "&callback=pbjs.handleSpringServeCB";

      return  spCall
    }

    function _callBids(params){
      bids = params.bids || [];
      for (var i = 0; i < bids.length; i++) {
        var bid = bids[i];
        bidmanager.pbCallbackMap[bid.params.imp_id] = params;
        adloader.loadScript(buildSpringServeCall(bid))
      }
    }

    pbjs.handleSpringServeCB = function(responseObj){
      if(responseObj && responseObj.seatbid && responseObj.seatbid.length > 0){
        //look up the request attributs stored in the bidmanager
        var responseBid = responseObj.seatbid[0].bid[0];
        var requestObj = bidmanager.getPlacementIdByCBIdentifer(responseBid.impid);
        var bid = bidfactory.createBid(1);

        //assign properties from the original request to the bid object
        for (var i = 0; i < requestObj.bids.length; i++ ){
          var bidRequest = requestObj.bids[i];
          if(bidRequest.bidder = "springserve"){
             var placementCode = bidRequest.placementCode;
             bid.width = bidRequest.params.width;
             bid.height = bidRequest.params.height;
          }
        }

        bid.bidderCode = requestObj.bidderCode;

        if(responseBid.hasOwnProperty('price') && responseBid.hasOwnProperty('adm')){
          //assign properties from the response to the bid object
          bid.cpm = responseBid.price;
          bid.ad = responseBid.adm;
        } else {
          //make object for invalid bid response
          bid = bidfactory.createBid(2);
          bid.bidderCode = 'springserve';
        }
      bidmanager.addBidResponse(placementCode, bid);
      }
    }

    // Export the callBids function, so that prebid.js can execute this function
    // when the page asks to send out bid requests.
    return {
        callBids: _callBids,
        buildSpringServeCall : buildSpringServeCall
    };
};

module.exports = SpringServeAdapter;
