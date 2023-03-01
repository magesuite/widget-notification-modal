<?php

namespace MageSuite\WidgetNotificationModal\Block\Adminhtml\Widget;

class DatePicker extends \Magento\Framework\View\Element\Template implements \Magento\Widget\Block\BlockInterface
{
    public function prepareElementHtml(\Magento\Framework\Data\Form\Element\AbstractElement $element)
    {
        $element->setData('after_element_html', '
                <input type="datetime-local"
                    value="' . $element->getValue() . '" 
                    id="' . $element->getHtmlId() . '"
                    name="' . $element->getName() . '"
                    class="admin__control-text" />');
        $element->setValue(null);
        return $element;
    }
}
