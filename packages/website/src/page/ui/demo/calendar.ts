import type { Model } from '../model'
import { calendarBasicDemo } from '../update'
import type { ViewBuilder } from '../viewBuilder'
import { calendarView } from './calendarView'

// DEMO CONTENT

const containerClassName =
  'inline-flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm select-none min-w-[304px] min-h-[324px]'

// VIEW

export const basicDemo = (model: Model, h: ViewBuilder) => {
  return [
    h.block(
      calendarBasicDemo.embedView({
        slotId: model.calendarBasicDemo.id,
        model: model.calendarBasicDemo,
        viewInputs: {
          maybeSelectedDate: model.maybeCalendarBasicDemoSelectedDate,
          toView: calendarView(containerClassName, h),
        },
      }),
    ),
  ]
}
