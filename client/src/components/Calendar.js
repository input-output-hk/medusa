import React, { Component } from 'react'
import SVG from 'react-inlinesvg'
import IconCalendar from '../style/images/control-calendar.svg'

export default class Calendar extends Component {
  render () {
    return (
      <button
        className='calendar border-0 bg-transparent'
        onClick={this.props.onClick}>
        <SVG src={IconCalendar}></SVG>
      </button>
    )
  }
}
