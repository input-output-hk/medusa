import React, { Component } from 'react'
import urlCal from '../style/images/control-calendar.svg'

export default class Calendar extends Component {
  render () {
    return (
      <button
        className='calendar border-0 bg-transparent'
        onClick={this.props.onClick}>
        <img src={urlCal} alt="" />
      </button>
    )
  }
}
