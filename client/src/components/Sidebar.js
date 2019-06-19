import React, {Component} from 'react'
import DatePicker from 'react-datepicker'
import Config from '../Config'
import SVG from 'react-inlinesvg'

import IconCalendar from '../style/images/control-calendar.svg'
import IconInfo from '../style/images/icon-info-circle.svg'
import IconClock from '../style/images/icon-clock.svg'
import IconPrev from '../style/images/control-prev.svg'

export default class Sidebar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      condition: false,
      mobilecal: false
    }
  }

  handleClick (event) {
    this.setState({
      condition: !this.state.condition
    })
    this.props.config.display.showSidebar = this.state.condition;
    if (typeof this.props.onChange === 'function') {
        this.props.onChange(this.state.condition)
    }
  }

  render () {
    return (
      <div className={this.state.condition ? 'UI-sidebar off' : 'UI-sidebar'}>
        <div className='content'>
          <button ref='btn' onClick={this.handleClick.bind(this)} className='close-sidebar'><SVG src={IconPrev}></SVG></button>
          {this.props.children}
        </div>
      </div>
    )
  }

}
