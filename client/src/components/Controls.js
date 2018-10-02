import React, { Component } from 'react'

import { IconContext } from "react-icons";
import { FaPlay, FaPause, FaChevronLeft } from 'react-icons/fa';

export default class Controls extends Component {
  render () {
    const playpause = (this.props.state.play) ? <button onClick={() => { this.props.setPlay(false) }} className="playpause border-0 bg-transparent"><FaPause /></button> : <button onClick={() => { this.props.setPlay(true) }} className="playpause border-0 bg-transparent"><FaPlay /></button>
    //console.log(this.props.state.play);
    return (
      <div className="slider">
        <div className="text-center d-block d-md-inline-block">{playpause}</div>
        <button onClick={this.props.goToPrev} className="prev border-0 bg-transparent"><FaChevronLeft /></button>
        {this.props.children}
      </div>
    )
  }
}
