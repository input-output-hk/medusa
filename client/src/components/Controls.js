import React, { Component } from 'react'

import SVG from 'react-inlinesvg'
import IconPlay from '../style/images/control-play.svg'
import IconPause from '../style/images/control-pause.svg'
import IconPrev from '../style/images/control-prev.svg'

export default class Controls extends Component {
  render () {
    const playpause = (this.props.state.play) ? <button onClick={() => { this.props.setPlay(false) }} className='playpause border-0 bg-transparent'><SVG src={IconPause}></SVG></button> : <button onClick={() => { this.props.setPlay(true) }} className='playpause border-0 bg-transparent'><SVG src={IconPlay}></SVG></button>
    // console.log(this.props.state.play);
    return (
      <div className='slider'>
        <div className='text-center d-block d-md-inline-block'>{playpause}</div>
        <button onClick={this.props.goToPrev} className='prev border-0 bg-transparent'><SVG src={IconPrev}></SVG></button>
        {this.props.children}
      </div>
    )
  }
}
