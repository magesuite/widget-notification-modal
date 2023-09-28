<?php

declare(strict_types=1);

namespace MageSuite\WidgetNotificationModal\Block\Adminhtml\Widget\Instance\Edit\Tab\Main;

class Layout extends \Magento\Widget\Block\Adminhtml\Widget\Instance\Edit\Tab\Main\Layout
{
    protected \Magento\Cms\Model\ResourceModel\Page\CollectionFactory $pageCollectionFactory;

    protected $_template = 'MageSuite_WidgetNotificationModal::instance/edit/layout.phtml';

    public function __construct(
        \Magento\Backend\Block\Template\Context $context,
        \Magento\Catalog\Model\Product\Type $productType,
        \Magento\Cms\Model\ResourceModel\Page\CollectionFactory $pageCollectionFactory,
        array $data = [],
        \Magento\Framework\Serialize\Serializer\Json $serializer = null
    ) {
        parent::__construct($context, $productType, $data, $serializer);

        $this->pageCollectionFactory = $pageCollectionFactory;
    }

    public function getCmsPagesChooser()
    {
        $chooserBlock = $this->getLayout()->createBlock(
            \Magento\Widget\Block\Adminhtml\Widget\Instance\Edit\Chooser\DesignAbstraction::class
        )->setName(
            'widget_instance[<%- data.id %>][specified_cms_page][layout_handle]'
        )->setId(
            'layout_handle'
        )->setClass(
            'required-entry select'
        )->setExtraParams(
            "onchange=\"WidgetInstance.loadSelectBoxByType(\'block_reference\', " .
            "this.up(\'div.specified_cms_pages\'), this.value)\""
        )->setArea(
            $this->getWidgetInstance()->getArea()
        )->setTheme(
            $this->getWidgetInstance()->getThemeId()
        );

        $cmsPages = $this->getCmsPagesOptions();

        foreach ($cmsPages as $cmsPage) {
            $chooserBlock->addOption($cmsPage['value'], $cmsPage['label']);
        }

        return $chooserBlock->toHtml();
    }

    /**
     * @return array
     * [
     *   'label' => string,
     *   'value' => string
     * ]
     */
    protected function getCmsPagesOptions(): array
    {
        $collection = $this->pageCollectionFactory->create();
        $collection->setOrder(\Magento\Cms\Api\Data\PageInterface::TITLE, \Magento\Framework\Data\Collection::SORT_ORDER_ASC);

        $cmsPages = $collection->getItems();
        $options = [];

        foreach ($cmsPages as $cmsPage) {
            $urlKey = $cmsPage->getData(\Magento\Cms\Api\Data\PageInterface::IDENTIFIER);
            $pageId = $cmsPage->getData(\Magento\Cms\Api\Data\PageInterface::PAGE_ID);
            $value = sprintf('%s|%s', $urlKey, $pageId);

            $options[] = [
                'label' => sprintf(
                    '%s | %s',
                    $cmsPage->getData(\Magento\Cms\Api\Data\PageInterface::TITLE),
                    $cmsPage->getStoreCode()
                ),
                'value' => $value
            ];
        }

        return $options;
    }

    protected function _getDisplayOnOptions(): array
    {
        $options = parent::_getDisplayOnOptions();

        $options[] = [
            'label' => $this->escapeHtmlAttr(__('CMS Pages')),
            'value' => [
                ['value' => \MageSuite\WidgetNotificationModal\Model\Widget\Instance::KEY_SPECIFIED_CMS_PAGE, 'label' => $this->escapeHtmlAttr(__('Specified Page'))],
            ],
        ];

        return $options;
    }
}
