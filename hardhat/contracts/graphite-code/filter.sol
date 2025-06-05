// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

interface IKYCContract {
    function level(address addr) external view returns (uint);
}

contract FilterContract {

    // Filter levels of the users.
    mapping(address => uint) filterLevel;
    IKYCContract public kycContract;

    event FilterLevelChanged(address indexed user, uint indexed level);

    /**
     * Setter of the users filter level.
     */
    function setFilterLevel(uint _level) external {
        filterLevel[msg.sender] = _level;
        emit FilterLevelChanged(msg.sender, _level);
    }

    /**
     * Getter of the users filter level.
     */
    function viewFilterLevel() external view returns(uint){
        return(filterLevel[msg.sender]);
    }

    /**
     * Returns true if sender kyc level is greater than destination's filter level.
     */
    function filter(address _sender, address _destination) external view returns(bool) {
        return(kycContract.level(_sender) >= filterLevel[_destination]);
    }
}