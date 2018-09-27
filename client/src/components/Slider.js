import React, { Component } from 'react'

import Play from '../style/images/control-play.svg'
import Pause from '../style/images/control-pause.svg'
import Calendar from '../style/images/control-calendar.svg'
import Prev from '../style/images/control-prev.svg'
import Next from '../style/images/control-next.svg'

export default class Slider extends Component {
  render () {
    return (
      <div className='slider'>
        <button className='playpause'><img src={Play} className='play' alt='' /><img src={Pause} className='pause' alt='' /></button>
        <button className='prev'><img src={Prev} alt='' /></button>
        {this.props.children}
        <button className='next'><img src={Next} alt='' /></button>
        <button className='calendar'><img src={Calendar} alt='' /></button>
      </div>
    )
  }
}
