import React, { Component } from 'react'
import { IconContext } from "react-icons";
import { FaCalendar } from 'react-icons/fa';

export default class Calendar extends Component {
  render () {
    return (
      <button
        className='calendar border-0 bg-transparent'
        onClick={this.props.onClick}>
        <FaCalendar />
      </button>
    )
  }
}
