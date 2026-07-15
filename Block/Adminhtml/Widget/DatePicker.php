<?php

declare(strict_types=1);

namespace MageSuite\WidgetNotificationModal\Block\Adminhtml\Widget;

class DatePicker extends \Magento\Framework\View\Element\Template implements \Magento\Widget\Block\BlockInterface
{
    public function prepareElementHtml(
        \Magento\Framework\Data\Form\Element\AbstractElement $element
    ): \Magento\Framework\Data\Form\Element\AbstractElement {
        $element->setData('after_element_html', '
                <input type="datetime-local"
                    value="' . $this->escapeHtmlAttr((string) $element->getValue()) . '"
                    id="' . $this->escapeHtmlAttr($element->getHtmlId()) . '"
                    name="' . $this->escapeHtmlAttr($element->getName()) . '"
                    class="admin__control-text" />');
        $element->setValue(null);
        return $element;
    }
}
