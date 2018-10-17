import React, {Component} from 'react'
import Close from '../style/images/close-side.svg'
import DatePicker from 'react-datepicker'
import Calendar from '../components/Calendar'

import { IconContext } from "react-icons";
import { FaChevronLeft,FaInfoCircle,FaCalendar } from 'react-icons/fa';

export default class Sidebar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      condition: false,
      mobilecal: false
    }
  }

  handleClick () {
    this.setState({
      condition: !this.state.condition
    })
  }

  mobilecalClick () {
    this.setState({
      mobilecal: !this.state.mobilecal
    })
  }

  render () {
    if (this.props.config.display.showSidebar) {
      return (
        <div className={this.state.condition ? 'UI-sidebar off' : 'UI-sidebar'}>
          <div className='content'>
            <button ref='btn' onClick={this.handleClick.bind(this)} className='close-sidebar'><FaChevronLeft /></button>
            <div className={this.state.mobilecal ? 'mobile-top d-md-none d-block calendar-showing' : 'mobile-top d-md-none d-block'}>
              <div className="row">
                <div className="col">
                  <span className='text-body'>{this.props.currentDate}</span>
                  <button ref='btn' onClick={this.mobilecalClick.bind(this)} className='calendar-show bg-transparent border-0 text-body p-0'><FaCalendar /></button>
                  <div className="calendar-wrap">
                    <DatePicker
                      inline
                      selected={this.props.selected}
                      onSelect={this.props.onSelect}
                      minDate={this.props.minDate}
                      maxDate={this.props.maxDate}
                    />
                  </div>
                </div>
                <div className="col text-right">
                  <span><button ref='btn' onClick={this.handleClick.bind(this)} className='close-info bg-transparent border-0 text-primary p-0'><FaInfoCircle /></button></span>
                </div>
              </div>
            </div>
            {this.props.children}
          </div>
        </div>
      )
    }
  }
}
